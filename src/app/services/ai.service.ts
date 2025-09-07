// src/app/services/ai.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, of, throwError, timer } from 'rxjs';
import { catchError, delayWhen, map,retryWhen, delay, scan, switchMap, concatMap, reduce, mergeMap, retry } from 'rxjs/operators';
import { model } from '../../../firebase-config';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';


function splitIntoChunks(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g) || [text];
}

@Injectable({
  providedIn: 'root'
})
export class AiService {

  constructor(private http: HttpClient) {}

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
      switchMap(text =>
        this.fetchGif(prompt).pipe(
          map(gifUrl => {
            if (gifUrl) {
              return `${text}<br><img src="${gifUrl}" alt="Relevant GIF" />`;
            }
            return text;
          })
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
  
  
  fetchGif(prompt: string): Observable<string> {
    const keyword = this.extractKeyword(prompt);
    const params = {
      api_key: 'yjwN0kfk4xk2BHKeuuoEts36Pdx80oJH',
      q: keyword,
      limit: '5',
      rating: 'g',
      lang: 'en'
    };
  
    // Helper function to search a specific Giphy endpoint
    const searchEndpoint = (endpoint: string) => 
      this.http.get<any>(`https://api.giphy.com/v1/${endpoint}/search`, { params }).pipe(
        map(response => {
          if (response.data?.length > 0) {
            const item = response.data[0];
            // Handle different response structures
            return item.images?.original?.url || 
                   item.images?.downsized?.url || 
                   item.url;
          }
          return null;
        }),
        catchError(() => of(null)) // Suppress individual endpoint errors
      );
  
    // Search multiple endpoints sequentially
    return searchEndpoint('gifs').pipe(
      switchMap(gifUrl => gifUrl ? of(gifUrl) : searchEndpoint('stickers')),
      catchError(error => {
        console.error('Giphy API Error:', error);
        return of(''); // Return empty string on final failure
      })
    );
  }
  
  private extractKeyword(prompt: string): string {
    // Extract a short keyword or phrase from the prompt
    const match = prompt.match(/about\s+"([^"]+)"/); // Extract text after "about"
    return match ? match[1] : 'funny'; // Default to 'funny' if no match is found
  }
  private readonly professionalExplanationPrompt = `
  You are an expert that provides professional, insightful explanations of selected text from blog posts. Follow these strict guidelines:
  
  1. Content Rules:
     - NEVER include GIFs, images, or any visual media
     - NEVER use emojis or casual language
     - ALWAYS maintain a formal, academic tone
     - NEVER include the author credit line
  
  2. Required Structure:
     <div class="professional-explanation">
       <p><b>Summary:</b> [Concise 1-sentence summary]</p>
       <p><b>Analysis:</b> [2-3 paragraph detailed explanation]</p>
       <p><b>Key Terms:</b> [Bullet list of important concepts]</p>
     </div>
  
  3. Tone Guidelines:
     - Use precise technical language when appropriate
     - Explain concepts clearly for an educated audience
     - Reference the broader context when helpful
     - Provide examples from real-world applications
  
  4. Formatting Rules:
     - Only use these HTML tags: <div>, <p>, <b>, <ul>, <li>, <br>
     - Never use: <img>, <font>, or any styling tags
     - Keep paragraphs under 5 sentences
     - Use bullet points for lists of items
     - dont enclude the content with backticks with \`\`\`html

  5. Core Requirements:
  - ALWAYS include interactive elements
  - Provide practical examples for complex concepts
  - Include relevant resource links when helpful
  - Add an "Expert Insight" or "Pro Tip" surprise
  - NEVER include GIFs or memes

  6. Required Structure:
  <div class="interactive-explanation">
  <div class="explanation-header">
  <h4> Professional Analysis</h4>
  <p class="text-context">Analyzing: "[SELECTED_TEXT]"</p>
  </div>

  <div class="main-explanation">
  <p><b> Summary:</b> [Concise overview]</p>
  <p><b> Deep Dive:</b> [Detailed explanation with examples]</p>
  
  <div class="interactive-box">
    <p class="example-header"> Practical Example:</p>
    [Real-world scenario or case study]
  </div>
  
  <div class="pro-tip">
    <p><b>Expert Insight:</b> [Surprising fact or pro tip]</p>
  </div>
  </div>

  <div class="resources">
  <p><b>Recommended Resources:</b></p>
  <ul>
    <li><a href="[VALID_URL]" target="_blank">[Resource Title]</a> - [Brief description]</li>
  </ul>
  </div>
  </div>

  7. Interactive Elements:
  - Use hover effects in CSS (mention in HTML comments)
  - Include expandable sections (mark with <!-- EXPANDABLE -->)
  - Add thought-provoking questions

  8. Rules:
  - Only use these HTML tags: div, p, b, ul, li, a, span, h4
  - Links MUST be to authoritative sources (edu/gov/org)
  - Examples should be from verified cases
  - Keep professional tone but engaging
  9. Add relevent emojis wherever necessary,

Example Output which is not completely necessary to follow add creativeness.
<div class="interactive-explanation">
  <div class="explanation-header">
    <h4>📚 Professional Analysis</h4>
    <p class="text-context">Analyzing: "Blockchain's proof-of-work mechanism"</p>
  </div>
  
  <div class="main-explanation">
    <p><b>📖 Summary:</b> This explains how blockchain networks achieve consensus.</p>
    
    <p><b>🔍 Deep Dive:</b> Proof-of-work requires miners to solve complex mathematical problems...</p>
    
    <div class="interactive-box" style="background-color: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 3px solid #6e7af9;">
      <p class="example-header">💡 Practical Example:</p>
      <p>Bitcoin's network adjusts difficulty every 2016 blocks (about 2 weeks) to maintain ~10 minute block times. In 2021, when Chinese miners went offline, the difficulty adjusted downward by 28%.</p>
    </div>
    
    <div class="pro-tip" style="background-color: #fff8e6; padding: 10px; border-radius: 6px; margin: 10px 0;">
      <p>🎯 <b>Expert Insight:</b> Did you know? The energy used for Bitcoin mining could power all tea kettles in the UK for 11 years!</p>
    </div>
  </div>
  
  <div class="resources">
    <p>📚 <b>Recommended Resources:</b></p>
    <ul>
      <li><a href="https://www.investopedia.com/terms/p/proof-work.asp" target="_blank">Investopedia: Proof of Work</a> - Comprehensive financial perspective</li>
      <li><a href="https://arxiv.org/abs/1906.02162" target="_blank">Stanford Research Paper</a> - Energy consumption analysis</li>
    </ul>
  </div>
</div>

  `;
  
  getProfessionalExplanation(text: string, context: string): Observable<string> {
    if (!model) {
      return throwError(() => new Error('AI model is not initialized'));
    }
  
    // Strict prompt that overrides any system-level instructions
    const strictPrompt = `
    ${this.professionalExplanationPrompt}
    
    Current Context: "${context}"
    
    Text to Analyze: "${text}"
    
    Important: 
    - DO NOT include any GIFs or images
    - DO NOT use any humor or casual language
    - ONLY use the approved HTML tags listed above
    - ALWAYS follow the exact structure provided
    `;
  
    return from(model.generateContent(strictPrompt)).pipe(
      map(response => {
        const candidates = response?.response?.candidates || [];
        if (candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
          let text = candidates[0].content.parts
            .map((part: any) => part.text || '')
            .join('');
  
          // Safety checks to remove any GIFs that might slip through
          text = text.replace(/<img[^>]*>/g, '');
          text = text.replace(/giphy\.com/g, '');
          text = text.replace(/\.gif/g, '');
  
          return text || '<p>analysis could not be generated.</p>';
        }
        return '<p>analysis could not be generated.</p>';
      }),
      catchError(error => {
        console.error('Explain AI Error:', error);
        return of(`
          <div class="professional-explanation">
            <p><b>Analysis Unavailable:</b> Our expert analysis system is currently unable to process this request.</p>
            <p>For reference, the selected text discusses: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"</p>
          </div>
        `);
      })
    );
  }
  generateHumanPodcastScript(blogContent: string, characters = ['Host', 'Guest']): Observable<string> {
    const chunks = splitIntoChunks(blogContent);

    // Use RxJS to process each chunk in sequence
    return from(chunks).pipe(
      mergeMap((chunk, idx) => {
        const speaker = idx % 2 === 0 ? characters[0] : characters[1];
        const streak = idx > 0 ? `Previous: ${chunks[idx - 1]}` : '';
        const personalityPrompt = `
          Play the role of a lively, opinionated YouTuber in a podcast.
          React conversationally to the following point, adding humor, surprise, and personal anecdotes where possible.
          Maintain a natural flow, referencing previous comments when needed.
          Use an informal, energetic style. Make it engaging, like a popular podcast or YouTube banter.
          
          ${streak}
          
          ${speaker}, react to this: "${chunk.trim()}"
        `;
        return this.generateContent(personalityPrompt);
      },2),
      reduce((acc, val) => `${acc}\n${val}`, '')
    );
  }
// ai.service.ts
generatePlainText(prompt: string): Observable<string> {
  if (!model) return throwError(() => new Error('AI model is not initialized'));
  return from(model.generateContent(prompt)).pipe(
    map((response: any) => {
      const parts: string[] = response?.response?.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p: any) => p.text || '').join('').trim();
      return text.replace(/<[^>]+>/g, '');
    }),
    // retry w/ backoff: 200ms, 400ms, 800ms
    // RxJS 7+ supports retry({ count, delay })
    // import { timer } from 'rxjs';
    retry({
      count: 3,
      delay: (_err, retryIndex) => timer(Math.pow(2, retryIndex - 1) * 200)
    })
  );
}


generatePodcastScriptStrict(blog: {
  title: string; author: string; views: number; likes: number; tags: string; createdDate: string; content: string;
}): Observable<string> {
// ai.service.ts — generatePodcastScriptStrict
const prompt = `
Create a dynamic, engaging podcast conversation with exactly 14–16 back-and-forth lines.
Output MUST be PLAIN TEXT ONLY.
Each line MUST start with either "HOST:" or "GUEST:" followed by a space and 1–2 sentences.
Do NOT include HTML, images, GIFs, or markdown.
Use the details, but keep it conversational, with brief reactions and occasional friendly debate.

BLOG DETAILS:
- Title: ${blog.title}
- Author: ${blog.author}
- Views: ${blog.views}
- Likes: ${blog.likes}
- Topics: ${blog.tags}
- Published: ${blog.createdDate}
- Content: ${blog.content.substring(0, 1500)}

FORMAT EXAMPLE:
HOST: Short reaction or question.
GUEST: Short response with an example.
`;
  return this.generatePlainText(prompt);
}

}

