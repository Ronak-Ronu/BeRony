import { Client, Account,Storage } from 'appwrite';

import { environment } from '../environments/environment';

export const client = new Client();

client
    .setEndpoint(environment.appwriteEndpoint)
    .setProject(environment.appwriteProjectId) // Replace with your project ID


export const account = new Account(client);
export const storage = new Storage(client);

export { ID } from 'appwrite';
