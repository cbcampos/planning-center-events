'use strict';
const safeUrl = value => {
  if(typeof value !== 'string') return null;
  try {const url=new URL(value);return url.protocol==='https:'?url.toString():null;}catch{return null;}
};
/** Public-only allowlist. Never expose private/link-only events or resource/owner data. */
function publicEvents(instances,included){
 const records=new Map(included.map(record=>[`${record.type}:${record.id}`,record]));
 return instances.flatMap(instance=>{
  const eventId=instance.relationships?.event?.data?.id;
  const parent=records.get(`Event:${eventId}`);const p=parent?.attributes;const a=instance.attributes;
  if(!p||!a||p.visible_in_church_center!==true||p.link_only!==false||p.approval_status!=='A'||a.kind!=='standard')return [];
  const starts=a.published_starts_at||a.starts_at;
  if(!starts||Number.isNaN(Date.parse(starts)))return [];
  const tags=[...(parent.relationships?.tags?.data||[]),...(instance.relationships?.tags?.data||[])];
  const seen=new Set();
  return [{id:String(instance.id),event_id:String(eventId),title:a.name||p.name||'Untitled Event',start_time:starts,end_time:a.published_ends_at||a.ends_at||null,location:a.location||null,description:p.summary||null,description_html:a.description||p.description||null,image_url:safeUrl(a.image_url||p.image_url),registration_url:safeUrl(p.registration_url),church_center_url:safeUrl(a.church_center_url),status:a.canceled_at?'canceled':'scheduled',canceled_at:a.canceled_at||null,tags:tags.flatMap(ref=>{
   if(seen.has(ref.id))return [];seen.add(ref.id);const tag=records.get(`Tag:${ref.id}`);if(!tag?.attributes?.name)return [];
   const group=records.get(`TagGroup:${tag.relationships?.tag_group?.data?.id}`);
   return [{id:String(ref.id),name:tag.attributes.name,group:group?.attributes?.name||null,group_id:group?.id||null}];
  })}];
 });
}
module.exports={publicEvents,safeUrl};
