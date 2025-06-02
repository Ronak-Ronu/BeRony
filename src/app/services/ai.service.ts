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
You are an AI assistant that generates well-structured, humorous, and engaging HTML content designed specifically to be rendered inside a web application. Follow these detailed instructions strictly to maintain a consistent, visually dynamic, and fun user experience:

General Rules:
- DO NOT include <html>, <head>, or <body> tags.
- DO NOT use backquotes or code blocks (e.g., \`\`\`) around the HTML response.
- DO NOT use <script>, <style>, or any executable code.

Content Structure:
- Use only semantic HTML elements:
  - <p> for text
  - <h3>, <h4> for headings
  - <ul>, <ol>, <li> for lists
  - <b>, <i>, <font color="...">, <br> for inline styling
- Use HTML inbuilt styling (e.g., color, font size) to enhance visual appeal.

Tone & Style:
- Use a funny, quirky, and engaging tone.
- Be creative and unique — avoid generic or robotic phrasing.
- Add personality, puns, or friendly sarcasm to entertain the user.

Visual Dynamics:
- Make it visually rich using:
  - <font color="..."> for emphasis
  - Lists for clarity
  - Emojis, bold/italic text
  - Spacing and playful formatting

Giphy GIF Requirement:
- Add a relevant, funny, and engaging Giphy GIF using:
  <img src="https://media.giphy.com/media/{GIF_ID}/giphy.gif" />
- Use only direct GIF URLs in this format (DO NOT use links with ?cid or broken previews).
- DO NOT use content-not-found or restricted gifs.
- Pick gifs that match the tone: quirky, confused, excited, etc.
- Position the gif wherever it best enhances the content.

Author Credit:
- Add a fun or styled line at the end to credit the post author.
  e.g., Post by: <font color="blue">Ronak</font>

Example Format{ this format is not necessary, but you can use it as a reference }:
<p><b>Ever tried debugging a bug that only shows up when your boss is watching?</b> Yeah, same energy as trying to sneeze with your eyes open. 😅</p>
<ul>
  <li>Step 1: Panic professionally</li>
  <li>Step 2: Blame the cache</li>
  <li>Step 3: Google like your life depends on it</li>
</ul>
<img src="https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif" />
<p>Post with ♥️ <font color="purple">Ronak</font> </p>
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

  generateContent(prompt: string): Observable<string> {
    if (!model) {
      return throwError(() => new Error('AI model is not initialized'));
    }
    const final_prompt = `${this.systemPrompt}\n\nUser Prompt: ${prompt}`;

    return from(model.generateContent(final_prompt)).pipe(
      map(response => {
        // console.log('Raw AI response:', JSON.stringify(response, null, 2)); 

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

  generateBlogInsights(blogContent: string, insightType: 'summary' | 'keyPoints' | 'sentiment'): Observable<string> {
    let prompt = '';
    switch (insightType) {
      case 'summary':
        prompt = `Summarize the following blog post from berony in 250 words or less :\n\nBLOG DETIALS: ${blogContent}`;
        break;
      case 'keyPoints':
        prompt = `Extract the top 3 key points from the following blog post from berony :\n\nBLOG DETAILS: ${blogContent}`;
        break;
      case 'sentiment':
        prompt = `Analyze the sentiment of the following blog post (positive, negative, neutral) from berony and explain why:\n\n${blogContent}`;
        break;
    }
    return this.generateContent(prompt);
  }

  answerQuestion(question: string, blogContent: string): Observable<string> {
    const prompt = `Based on the following blog post, answer the question: "${question}"\n\nBlog Details:\n${blogContent}`;
    return this.generateContent(prompt);
  }


  generateBlogContent(topic: string, username: string): Observable<string> {
    const prompt = `
      Generate a complete blog post about "${topic}". The post should include:
      - A catchy title in an <h3> tag.
      - An engaging introduction (1-2 paragraphs).
      - 3-5 key sections with <h4> headings, each containing 1-2 paragraphs or a list.
      - A relevant Giphy GIF using <img src="..."> that matches the topic or tone.
      - A closing paragraph with a call-to-action or reflection.
      - An author credit line: "Post with ♥️ <font color='purple'>${username}</font>".
      Ensure the content is humorous, engaging, and follows the system prompt's tone and style guidelines.
    `;
    return this.generateContent(prompt);
  }

  getSuggestions(partialContent: string): Observable<string[]> {
    if (!partialContent.trim()) {
      return from([[]]);
    }
    const prompt = `
      Based on the following partial blog content, provide 3 short suggestions (each 10-20 words) to enhance the content. Suggestions should:
      - Be creative, humorous, and align with the system prompt's tone.
      - Offer ideas for the next sentence or paragraph.
      - Be formatted as plain text (not HTML).
      Partial content: "${partialContent}"
    `;
    return this.generateContent(prompt).pipe(
      map(response => {
        try {
          const suggestions = response.split('\n').map(s => s.trim()).filter(s => s);
          return suggestions.slice(0, 3);
        } catch {
          return ['Try adding a funny anecdote here!', 'How about a quirky list?', 'Insert a pun for extra flair!'];
        }
      })
    );
  }


}