import { env } from 'cloudflare:workers';
export async function POST(req: Request) {
 const key = (env as any).ADMIN_KEY;
 if (!key || req.headers.get('Authorization') !== `Bearer ${key}`) return Response.json({ error:'Acceso restringido.' },{status:401});
 const origin = req.headers.get('Origin');
 if (origin && origin !== new URL(req.url).origin) return Response.json({error:'Solicitud inválida.'},{status:403});
 if (Number(req.headers.get('Content-Length') || 0) > 8000000) return Response.json({error:'La foto debe pesar menos de 8 MB.'},{status:413});
 const form = await req.formData(), file = form.get('photo');
 if (!(file instanceof File) || file.size > 8000000 || !file.size) return Response.json({error:'Seleccioná una foto de menos de 8 MB.'},{status:400});
 const bytes = new Uint8Array(await file.arrayBuffer());
 const jpeg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255, png = bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71;
 const webp = String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if (!jpeg && !png && !webp) return Response.json({error:'Usá una foto JPG, PNG o WebP.'},{status:400});
 const id = crypto.randomUUID();
 await env.BUCKET!.put(id,bytes,{httpMetadata:{contentType:jpeg?'image/jpeg':png?'image/png':'image/webp'}});
 return Response.json({url:`/api/image/${id}`});
}
