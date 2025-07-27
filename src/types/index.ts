
export type Task = {
  id: string;
  userId: string;
  name: string;
  duration: number; // in minutes
  completed: boolean;
  createdAt: any; // Can be a server timestamp
};

export type MockUser = {
  uid: string;
  email: string;
  isMockUser: true;
}
