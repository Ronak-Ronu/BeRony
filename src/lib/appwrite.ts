import { Client, Account} from 'appwrite';
import { environment } from '../environments/environment';

export const client = new Client();

client
    .setEndpoint(environment.appwriteEndpoint)
    .setProject(environment.appwriteProjectId) // Replace with your project ID



export const account = new Account(client);
export { ID } from 'appwrite';
