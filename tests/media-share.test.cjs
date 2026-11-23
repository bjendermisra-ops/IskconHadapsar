const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../temple-share.js'),'utf8');
function app() {
  let result;
  const location = {href:'https://iskconhadapsar.vercel.app/pages/a.html', origin:'https://iskconhadapsar.vercel.app',assign:value=>{result=new URL(value,location.href)}};
  const window = {alert:message=>assert.fail(message)};
  vm.runInNewContext(source,{window,location,navigator:{userAgent:'Android HadapsarMedia/1'},document:{addEventListener(){}},URL,URLSearchParams});
  return {api:window.TempleShare, result:()=>result};
}
test('invitation shares an image and keeps the app link in the caption',async()=>{
  const {api,result}=app(); await api.shareApp('hi');
  assert.equal(result().pathname,'/__native_action__/share-image');
  assert.equal(result().searchParams.get('url'),'https://iskconhadapsar.vercel.app/krishna.webp');
  assert.ok(result().searchParams.get('text').endsWith('https://www.iskconhadapsar.online/app'));
});
test('media actions use the selected asset on a nested page',async()=>{
  const {api,result}=app();
  for(const [fn,action] of [['download','download'],['saveImage','save-image'],['setWallpaper','wallpaper'],['setRingtone','ringtone']]){
    await api[fn]('file.ext','title');assert.equal(result().pathname,'/__native_action__/'+action);
    assert.equal(result().searchParams.get('url'),'https://iskconhadapsar.vercel.app/pages/file.ext');
  }
  await api.shareText('हरे कृष्ण');assert.equal(result().searchParams.get('text'),'हरे कृष्ण');
});

test('Evening Lotus opens its native preview route',async()=>{
  const {api,result}=app();
  await api.openLiveLotus();
  assert.equal(result().pathname,'/__native_action__/live-lotus');
});
