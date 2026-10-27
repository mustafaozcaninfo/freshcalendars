#!/usr/bin/env python3
"""Copy an explicitly selected published revision's editorial data locally; preserve design/code."""
import argparse,datetime,hashlib,io,json,pathlib,re,shutil,subprocess,tarfile
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--ref',required=True);args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent
revision=subprocess.check_output(['git','rev-parse',args.ref+'^{commit}'],cwd=root,text=True).strip()
prefixes=['apps/news/src/content','apps/news/src/assets','apps/news/public']
excluded=['apps/news/src/assets/design/','apps/news/public/design/']
def editorial(name):return any(name.startswith(p+'/') for p in prefixes) and not any(name.startswith(p) for p in excluded)
def digest(data):return hashlib.sha256(data).hexdigest()
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup=root/'.cache'/'news-sync'/stamp;backup.mkdir(parents=True,exist_ok=False)
manifest={'revision':revision,'backup':str(backup),'added':[],'updated':[],'removed':[],'unchanged':0,'preservedDesignPaths':excluded,'files':{}}
archive=subprocess.check_output(['git','archive',revision,'--',*prefixes],cwd=root)
target=set()
with tarfile.open(fileobj=io.BytesIO(archive),mode='r:') as source:
 for member in source:
  if not member.isfile():continue
  name=member.name
  if not editorial(name):continue
  if '..' in pathlib.PurePosixPath(name).parts:raise RuntimeError('Unexpected archive path')
  dest=root/name
  if dest.is_symlink():raise RuntimeError('Refusing to overwrite symlink: '+name)
  target.add(name);data=source.extractfile(member).read();manifest['files'][name]=digest(data)
  if dest.exists() and dest.read_bytes()==data:manifest['unchanged']+=1;continue
  if dest.exists():
   old=backup/name;old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dest,old);manifest['updated'].append(name)
  else:manifest['added'].append(name)
  dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
tracked=subprocess.check_output(['git','ls-tree','-r','--name-only','HEAD','--',*prefixes],cwd=root,text=True).splitlines()
for name in tracked:
 if editorial(name) and name not in target and (root/name).is_file():
  old=backup/name;old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,old);(root/name).unlink();manifest['removed'].append(name)
# Key dates are editorial data embedded beside a shared client script; preserve local JS fixes.
name='apps/news/src/lib/keydates.ts';path=root/name;current=path.read_text();remote=subprocess.check_output(['git','show',revision+':'+name],cwd=root,text=True)
pattern=r'export const KEY_DATES: KeyDate\[\] = \[.*?\n\];';match=re.search(pattern,remote,re.S)
if not match:raise RuntimeError('Cannot identify KEY_DATES data')
updated,n=re.subn(pattern,lambda _:match.group(),current,count=1,flags=re.S)
if n!=1:raise RuntimeError('Cannot locate local KEY_DATES data')
if updated!=current:
 old=backup/name;old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,old);path.write_text(updated);manifest['updated'].append(name)
manifest['keyDatesSha256']=digest(match.group().encode())
report=root/'output'/'parity-audit'/'sync-manifest.json';report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(backup/'manifest.json').write_text(report.read_text())
print(json.dumps({k:v if k not in ['added','updated','removed'] else len(v) for k,v in manifest.items() if k!='files'},ensure_ascii=False,indent=2))
