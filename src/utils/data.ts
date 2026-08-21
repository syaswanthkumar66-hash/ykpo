export type Subject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Engineering';

export interface QuestionData {
  id: number;
  questionId?: string;
  subject: Subject;
  chosen: number | null;
  correct: number;
  html?: string;
}

export interface ResponseSheet {
  id: string;
  candidateName: string;
  hallTicket: string;
  subjectName: string;
  testCenter: string;
  testDate: string;
  candidateTableHtml?: string;
  url?: string;
  questions: QuestionData[];
}

export function getSubject(id: number): Subject {
  if (id <= 50) return 'Mathematics';
  if (id <= 75) return 'Physics';
  if (id <= 100) return 'Chemistry';
  return 'Engineering';
}

export function parseInputData(input: string, baseUrl?: string): ResponseSheet | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');

  const safeExtract = (regexes: RegExp[], defaultVal: string = 'Unknown') => {
    for (const r of regexes) {
       const match = input.match(r);
       if (match && match[1]) {
           return match[1].replace(/<[^>]+>/g, '').trim();
       }
    }
    return defaultVal;
  };

  const candidateName = safeExtract([
     />\s*Candidate Name\s*<[^\n]*?<td[^>]*>\s*(.*?)\s*<\/td>/i,
     /Candidate Name[\s\S]{1,50}?<td>\s*(.*?)\s*<\/td>/i,
     /Candidate Name.*?([A-Z\s]{3,40})/i
  ]);

  const hallTicket = safeExtract([
     />\s*Hall Ticket Number\s*<[^\n]*?<td[^>]*>\s*(.*?)\s*<\/td>/i,
     />\s*Roll Number\s*<[^\n]*?<td[^>]*>\s*(.*?)\s*<\/td>/i,
     /Registration ID[\s\S]{1,50}?<td>\s*(.*?)\s*<\/td>/i,
     /(?:Hall Ticket Number|Registration ID).*?([A-Z0-9]{5,20})/i
  ]);

  const testDate = safeExtract([
     />\s*Test Date\s*<[^\n]*?<td[^>]*>\s*(.*?)\s*<\/td>/i,
     /Test Date.*?(\d{2}\/\d{2}\/\d{4})/i
  ]);

  const testCenter = safeExtract([
     />\s*Test Center Name\s*<[^\n]*?<td[^>]*>\s*(.*?)\s*<\/td>/i
  ]);

  const subjectName = safeExtract([
     />\s*Subject\s*<[^\n]*?<td[^>]*>\s*(.*?)\s*<\/td>/i,
     /Subject.*?([a-zA-Z\s]+Engineering|Mathematics|Physics|Chemistry)/i
  ]);

  let candidateTableHtml = '';
  const mainInfoPnl = doc.querySelector('.main-info-pnl');
  if (mainInfoPnl) {
    const pnl = mainInfoPnl.cloneNode(true) as HTMLElement;
    // Clean up inline styles that might break our layout but keep semantic ones
    Array.from(pnl.querySelectorAll('table')).forEach(t => {
       t.style.width = '100%';
       t.style.maxWidth = '600px';
       t.style.margin = '10px auto';
       t.style.borderCollapse = 'collapse';
    });
    Array.from(pnl.querySelectorAll('td')).forEach(td => {
      td.style.padding = '8px';
      td.style.border = '1px solid #ccc';
    });
    // Add the orange border
    pnl.style.border = '2px solid #ffbd52';
    pnl.style.padding = '10px';
    pnl.style.backgroundColor = '#fff';
    pnl.style.borderRadius = '8px';
    pnl.style.overflowX = 'auto';

    candidateTableHtml = pnl.outerHTML;
  } else {
    // Fallback
    const candidateTds = Array.from(doc.querySelectorAll('td, th')).filter(el => el.textContent?.includes('Candidate Name'));
    if (candidateTds.length > 0) {
      const table = candidateTds[0].closest('table');
      if (table) {
        const t = table.cloneNode(true) as HTMLTableElement;
        t.removeAttribute('width');
        t.classList.add('w-full', 'border-collapse', 'bg-white', 'text-sm', 'shadow-sm', 'rounded-lg', 'overflow-hidden');
        Array.from(t.querySelectorAll('td, th')).forEach(td => {
           td.classList.add('border', 'border-slate-200', 'p-3', 'text-slate-700');
           td.removeAttribute('width');
        });
        candidateTableHtml = t.outerHTML;
      }
    }
  }

  const questions: QuestionData[] = [];
  
  // Find question containers
  let questionContainers = Array.from(doc.querySelectorAll('.question-pnl'));
  
  if (questionContainers.length === 0) {
    questionContainers = Array.from(doc.querySelectorAll('table.questionPnlTbl'));
  }
  if (questionContainers.length === 0) {
    questionContainers = Array.from(doc.querySelectorAll('table.questionRowTbl'));
  }
  if (questionContainers.length === 0) {
    questionContainers = Array.from(doc.querySelectorAll('.section-cntnr .question-row'));
  }
  
  if (questionContainers.length === 0) {
    const qidTds = Array.from(doc.querySelectorAll('td, div')).filter(el => el.textContent?.trim().startsWith('Question ID')) as HTMLElement[];
    questionContainers = qidTds.map(td => {
      let curr: HTMLElement | null = td;
      while (curr && curr.tagName !== 'BODY') {
        if (curr.classList?.contains('questionPnlTbl') || (curr.tagName === 'TABLE' && curr.parentElement?.classList?.contains('question-pnl'))) {
           return curr;
        }
        if ((curr.tagName === 'TABLE' || curr.tagName === 'DIV') && 
            curr.textContent?.includes('Chosen Option') && 
            (curr.textContent?.includes('Ans') || curr.textContent?.includes('Q.'))) {
           break;
        }
        curr = curr.parentElement;
      }
      return curr;
    }).filter(Boolean) as HTMLElement[];
    questionContainers = Array.from(new Set(questionContainers));
  }

  let index = 1;
  const baseUrlObj = baseUrl ? new URL(baseUrl) : null;

  for (const container of questionContainers) {
    const html = container.outerHTML;
    const text = container.textContent || '';
    
    let chosen: number | null = null;
    const chosenMatch = text.match(/Chosen Option\s*:\s*(\d+|--|Not\s*Answered)/i);
    if (chosenMatch) {
      const val = chosenMatch[1].trim();
      if (val !== '--' && val.toLowerCase() !== 'not answered') {
        chosen = parseInt(val, 10);
      }
    }

    let correct = 1;
    const rightAnsMatch = html.match(/class="?[^"]*rightAns[^"]*"?[^>]*>.*?(\d+)\s*\./is);
    const tickMatch = html.match(/<img[^>]*src="?[^"]*tick[^"]*"?[^>]*>.*?(\d+)\s*\./is) || html.match(/<img[^>]*src="?[^"]*right[^"]*"?[^>]*>.*?(\d+)\s*\./is);
    const unicodeTickMatch = html.match(/[\u2713\u2714\u2611]\s*(\d+)/is);

    if (rightAnsMatch) {
      correct = parseInt(rightAnsMatch[1], 10);
    } else if (tickMatch) {
      correct = parseInt(tickMatch[1], 10);
    } else if (unicodeTickMatch) {
      correct = parseInt(unicodeTickMatch[1], 10);
    }

    let questionId: string | undefined;
    const qidMatch = text.match(/Question ID\s*:\s*(\d+)/i) || text.match(/Question ID[^\d]*(\d+)/i);
    if (qidMatch) {
      questionId = qidMatch[1];
    }
    
    const sanitizedContainer = container.cloneNode(true) as HTMLElement;
    
    // Only adjust img src paths and basic responsiveness
    Array.from(sanitizedContainer.querySelectorAll('img')).forEach(img => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      // Fix relative image URLs
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http')) {
        if (baseUrlObj) {
           img.setAttribute('src', new URL(src, baseUrlObj.origin).toString());
        } else if (src.startsWith('/')) {
           img.setAttribute('src', 'https://cdn.digialm.com' + src);
        } else {
           img.setAttribute('src', 'https://cdn.digialm.com/' + src);
        }
      }
    });

    questions.push({
      id: index++,
      questionId,
      subject: getSubject(index - 1),
      chosen,
      correct,
      html: sanitizedContainer.outerHTML
    });
  }

  // Fallback to simpler parsing if DOM extraction failed to find questions
  if (questions.length === 0) {
      return null;
  }

  return {
    id: hallTicket !== 'Unknown' ? hallTicket : Date.now().toString(),
    candidateName,
    hallTicket,
    subjectName,
    testCenter,
    testDate,
    candidateTableHtml,
    url: baseUrl,
    questions
  };
}
