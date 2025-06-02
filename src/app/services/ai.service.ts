// src/app/services/ai.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, delayWhen, map,retryWhen, delay, scan } from 'rxjs/operators';
import { model } from '../../../firebase-config';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  constructor() {}

  private readonly systemPrompt = `
    You are an AI assistant that generates responses in valid HTML format for rendering in a web application. 
    - Dont include any HTML tags like <html>, <head>, <body> in the response.
    - Dont inlcude any backquotes in the response before html.
    - Structure your response using semantic HTML tags (e.g., <p>, <ul>, <li>, <h3>, <h4>) to ensure readability.
    - Avoid using <script>, <style>, or any executable code in the response.
    - At the end of your response or anywhere you prefer to, include  a relevant Giphy GIF (e.g., https://media.giphy.com/media/abc123/giphy.gif) that matches the tone or content of the response.
    - Ensure the GIF is appropriate, engaging, and enhances the user experience.
    - Use funny tone and make it engaging and fun.
    - You can use the html tags inbuilt styling parameters to make the response more visually appealing (e.g: <font color="red">berony</font>).
    - Also give credits to the post author at the end of the response.

    Example response format:
    <p>Your main response here.</p>
    {if needed needed points}
    <ul>
      <li>Point 1</li>
      <li>Point 2</li>
    </ul>
    {if you want to add a gif, use relevent giphy gif rather content not found gifs}
     <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3h6emR0dThjZXA0N281ZWoxYTcyYTFmZDZkbnRyenMzcjN6YnB1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tqj4m9BRURayxQAIW9/giphy.gif" />
    <p>some more reponse if needed.</p> 
  `;

  // // Generate AI response for a given prompt
  // generateContent(prompt: string): Observable<string> {
  //   return from(model.generateContent(prompt)).pipe(
  //     map(response => {
  //       console.log(response);
  //       // Assuming the response contains a text field; adjust based on actual response structure
  //       return (response as any).text || 'No response generated';
  //     }),
  //     catchError(error => {
  //       console.error('AI Generation Error:', error);
  //       return throwError(() => new Error('Failed to generate AI content'));
  //     })
  //   );
  // }

  // Generate AI response for a given prompt
  generateContent(prompt: string): Observable<string> {
    if (!model) {
      return throwError(() => new Error('AI model is not initialized'));
    }
    const final_prompt = `${this.systemPrompt}\n\nUser Prompt: ${prompt}`;

    return from(model.generateContent(final_prompt)).pipe(
      map(response => {
        // console.log('Raw AI response:', JSON.stringify(response, null, 2)); 

        // Extract text from the response
        const candidates = response?.response?.candidates || [];
        if (candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
          const text = candidates[0].content.parts
            .map((part: any) => part.text || '')
            .join('');
          return text || 'No valid text generated';
        }
        return 'No response generated';
      }),
      retryWhen(errors =>
        errors.pipe(
          scan((retryCount, error) => {
            if (retryCount >= 5) {
              throw error; // Stop retrying after 5 attempts
            }
            console.warn(`Retrying... Attempt #${retryCount + 1}`);
            return retryCount + 1;
          }, 0),
          delayWhen((retryCount: number) => from([null]).pipe(delay(retryCount * 2000))) // Increase delay with each retry
        )
      ),
      catchError(error => {
        console.error('AI Generation Error:', error);
        return throwError(() => new Error(`Failed to generate AI content: ${error.message}`));
      })
    );
  }
  // Generate blog insights (e.g., summary, key points)
  generateBlogInsights(blogContent: string, insightType: 'summary' | 'keyPoints' | 'sentiment'): Observable<string> {
    let prompt = '';
    switch (insightType) {
      case 'summary':
        prompt = `Summarize the following blog post from berony in 250 words or less :\n\n${blogContent}`;
        break;
      case 'keyPoints':
        prompt = `Extract the top 3 key points from the following blog post from berony :\n\n${blogContent}`;
        break;
      case 'sentiment':
        prompt = `Analyze the sentiment of the following blog post (positive, negative, neutral) from berony and explain why:\n\n${blogContent}`;
        break;
    }
    return this.generateContent(prompt);
  }

  // Answer user questions about the blog
  answerQuestion(question: string, blogContent: string): Observable<string> {
    const prompt = `Based on the following blog post, answer the question: "${question}"\n\nBlog Post:\n${blogContent}`;
    return this.generateContent(prompt);
  }
}