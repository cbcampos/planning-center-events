require('dotenv').config();
const axios=require('axios');
const {publicEvents}=require('../../lib/public-calendar');
const cache=new Map();const TTL=5*60*1000;
const endpoint='https://api.planningcenteronline.com/calendar/v2/event_instances';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, OPTIONS','Content-Type':'application/json'};
const result=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
exports.handler=async function(request){
 if(request.httpMethod==='OPTIONS')return {statusCode:204,headers,body:''};
 if(request.httpMethod!=='GET')return result(405,{error:'Method not allowed'});
 const query=request.queryStringParameters||{};
 if(query.id&&!/^\d+$/.test(query.id))return result(400,{error:'Invalid event occurrence'});
 const limit=Math.min(500,Math.max(1,Number.parseInt(query.limit||'20',10)||20));
 const key=`${query.id||'upcoming'}:${limit}`;const cached=cache.get(key);
 if(cached&&Date.now()-cached.time<TTL)return result(200,{...cached.data,_cached:true});
 const username=process.env.EXPO_PUBLIC_PCO_APPLICATION_ID||process.env.PC_APP_ID;
 const password=process.env.EXPO_PUBLIC_PCO_SECRET||process.env.PC_SECRET;
 if(!username||!password)return result(503,{error:'Calendar temporarily unavailable'});
 try{
  const params={include:'event,event.tags,tags,tags.tag_group',
   'fields[EventInstance]':'name,starts_at,ends_at,published_starts_at,published_ends_at,location,church_center_url,canceled_at,description,image_url,kind,event,tags',
   'fields[Event]':'name,summary,description,image_url,registration_url,visible_in_church_center,link_only,approval_status,tags',
   per_page:100,order:'starts_at'};
  if(!query.id)params['where[starts_at][gte]']=new Date().toISOString();
  let next=query.id?`${endpoint}/${query.id}`:endpoint;let instances=[];let included=[];let pages=0;
  while(next&&pages<10){
   const url=new URL(next);
   if(url.origin!=='https://api.planningcenteronline.com'||!url.pathname.startsWith('/calendar/v2/event_instances'))throw new Error('Invalid pagination target');
   const response=await axios.get(url.toString(),{auth:{username,password},params:pages===0?params:undefined,timeout:15000});
   const body=response.data;if(!body?.data)throw new Error('Invalid calendar response');
   instances.push(...(Array.isArray(body.data)?body.data:[body.data]));included.push(...(body.included||[]));pages++;next=body.links?.next||null;
   if(query.id)break;
  }
  const visible=publicEvents(instances,included).sort((a,b)=>Date.parse(a.start_time)-Date.parse(b.start_time));
  const data={events:visible.slice(0,limit),complete:!next&&visible.length<=limit,fetched_at:new Date().toISOString(),source:'planning-center-calendar'};
  cache.set(key,{time:Date.now(),data});return result(200,data);
 }catch(error){console.error('Public calendar retrieval failed',error.response?.status||error.code||'upstream_error');return result(503,{error:'Calendar temporarily unavailable'});}
};
