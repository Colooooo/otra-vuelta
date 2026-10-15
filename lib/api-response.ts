export async function readApiResponse(response: Response, fallback: string): Promise<any> {
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(fallback);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(fallback);
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : fallback);
  return data;
}
