export interface Source {
  id: string;
  type: 'blog' | 'article' | 'newsletter';
  url?: string;
  email?: string;
  name: string;
  addedAt: string;
  lastScanned: string | null;
}

export interface Inspiration {
  id: string;
  sourceId: string;
  title: string;
  description: string;
  url: string;
  score: number;
  addedAt: string;
  tags: string[];
}

export interface Content {
  id: string;
  type: 'article' | 'linkedin' | 'x_post';
  title: string;
  body: string;
  inspirationIds: string[];
  status: 'draft' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface Reference {
  id: string;
  type: 'book' | 'person';
  name: string;
  author?: string;
  knownFor?: string;
  topics: string[];
  addedAt: string;
  addedBy: 'user' | 'agent';
}
