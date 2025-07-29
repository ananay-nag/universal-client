// src/protocols/grpcClient.ts

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

interface ClientCacheEntry {
  client: any;
  packageDef: any;
}

const clientCache: Record<string, ClientCacheEntry> = {};

/**
 * Returns cached or new gRPC client for given protoFile, service and address.
 */
export function getGrpcClient(
  protoFile: string,
  packageName: string,
  serviceName: string,
  address: string,
): any {
  const cacheKey = `${protoFile}:${address}:${serviceName}`;
  if (!clientCache[cacheKey]) {
    const packageDefinition = protoLoader.loadSync(protoFile, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const grpcPackage: any = grpc.loadPackageDefinition(packageDefinition);
    const ServiceCtor = packageName
      .split('.')
      .reduce((obj, key) => obj[key], grpcPackage)[serviceName];
    const client = new ServiceCtor(address, grpc.credentials.createInsecure());
    clientCache[cacheKey] = { client, packageDef: grpcPackage };
  }
  return clientCache[cacheKey].client;
}

/**
 * Calls a unary gRPC method with optional metadata and deadline.
 */
export function callGrpc(
  client: any,
  methodName: string,
  params: any,
  timeoutMs?: number,
  metadata?: grpc.Metadata,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const args: any[] = [params];
    if (metadata) args.push(metadata);

    if (timeoutMs) {
      const deadline = Date.now() + timeoutMs;
      args.push({ deadline });
    }

    args.push((err: grpc.ServiceError | null, resp: any) => {
      if (err) return reject(err);
      resolve(resp);
    });

    client[methodName](...args);
  });
}
