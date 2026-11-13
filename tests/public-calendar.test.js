const {test}=require('node:test');const assert=require('node:assert/strict');const {publicEvents}=require('../lib/public-calendar');
const i={id:'1',attributes:{name:'Sunday',kind:'standard',starts_at:'2026-11-15T15:00:00Z'},relationships:{event:{data:{id:'2'}}}};
const e={type:'Event',id:'2',attributes:{visible_in_church_center:true,link_only:false,approval_status:'A',summary:'Public'},relationships:{}};
test('requires explicit public visibility and excludes link-only',()=>{assert.equal(publicEvents([i],[]).length,0);assert.equal(publicEvents([i],[{...e,attributes:{visible_in_church_center:false}}]).length,0);assert.equal(publicEvents([i],[{...e,attributes:{visible_in_church_center:true,link_only:true}}]).length,0)});
test('keeps parent and occurrence identities, no inferred tags',()=>{const r=publicEvents([i],[e])[0];assert.equal(r.id,'1');assert.equal(r.event_id,'2');assert.deepEqual(r.tags,[]);assert.equal(r.status,'scheduled')});
test('canceled remains clearly marked, unsafe images omitted',()=>{const r=publicEvents([{...i,attributes:{...i.attributes,canceled_at:'2026-11-13T00:00:00Z',image_url:'javascript:alert(1)'}}],[e])[0];assert.equal(r.status,'canceled');assert.equal(r.image_url,null)});

test('pending/rejected/missing approval and blockouts fail closed',()=>{for(const status of ['P','R',undefined])assert.equal(publicEvents([i],[{...e,attributes:{...e.attributes,approval_status:status}}]).length,0);assert.equal(publicEvents([{...i,attributes:{...i.attributes,kind:'blockout'}}],[e]).length,0)});
