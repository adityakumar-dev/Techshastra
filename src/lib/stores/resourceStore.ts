import { createLocalStore } from "../localStore";

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  difficulty: string | null;
}

const store = createLocalStore<Resource>("ts_resources");

export const getResources = () => store.getAll();
export const getResource = (id: string) => store.getById(id);
export const addResource = (resource: Omit<Resource, "id">) => store.add(resource);
export const updateResource = (id: string, data: Partial<Resource>) => store.update(id, data);
export const deleteResource = (id: string) => store.delete(id);
