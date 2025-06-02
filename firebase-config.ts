import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { environment } from './src/environments/environment';

const firebaseApp = initializeApp(environment.firebaseConfig);
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: 'gemini-2.0-flash' });


export { firebaseApp, ai, model };

