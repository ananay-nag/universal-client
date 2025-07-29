// src/protocols/httpClient.ts

import axios from 'axios';

export async function callHttp(
  url: string,
  method: string,
  data: any,
  timeoutMs?: number,
  headers: Record<string, string> = {}
): Promise<any> {
  const response = await axios({
    url,
    method: method.toLowerCase(),
    data,
    timeout: timeoutMs ?? 10000,
    headers
  });
  return response.data;
}
