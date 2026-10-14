import { readPhoto } from '@/lib/photos';
export const runtime = 'nodejs';
export async function GET(req: Request, { params }: { params: Promise<{id:string}> }) {
 const {id} = await params;
 if (!/^[a-f0-9-]{36}$/.test(id)) return new Response('No encontrada',{status:404});
 const obj = await readPhoto(id);
 if (!obj) return new Response('No encontrada',{status:404});
 return new Response(obj.body,{headers:{'Content-Type':obj.contentType,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
}
