import { MosqueRepository } from './types';
import { JsonMosqueRepository } from './json-repository';

let repositoryInstance: MosqueRepository | null = null;

export function getMosqueRepository(): MosqueRepository {
  if (!repositoryInstance) {
    repositoryInstance = new JsonMosqueRepository();
  }
  return repositoryInstance;
}
