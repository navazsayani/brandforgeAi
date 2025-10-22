/**
 * Preview emails locally by generating HTML files
 * Run with: npx tsx functions/src/preview-emails.ts
 */

import { render } from '@react-email/render';
import ExampleShowcaseEmail from './emails/ExampleShowcaseEmail';
import TemplateShowcaseEmail from './emails/TemplateShowcaseEmail';
import FinalReminderEmail from './emails/FinalReminderEmail';
import * as fs from 'fs';
import * as path from 'path';

async function generatePreviews() {
  const userName = 'Sarah';
  const previewDir = path.join(process.cwd(), '..', 'email-previews');

  // Create preview directory
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  console.log('📧 Generating email previews...\n');

  // 1. Example Showcase Email
  console.log('Rendering ExampleShowcaseEmail...');
  const exampleHtml = await render(
    ExampleShowcaseEmail({
      userName,
      quickStartUrl: 'https://brandforge.me/quick-start',
      industry: 'business',
    })
  );
  const examplePath = path.join(previewDir, '1-example-showcase-email.html');
  fs.writeFileSync(examplePath, exampleHtml);
  console.log(`✅ Saved to: ${examplePath}`);

  // 2. Template Showcase Email
  console.log('Rendering TemplateShowcaseEmail...');
  const templateHtml = await render(
    TemplateShowcaseEmail({
      userName,
      templatesUrl: 'https://brandforge.me/templates',
    })
  );
  const templatePath = path.join(previewDir, '2-template-showcase-email.html');
  fs.writeFileSync(templatePath, templateHtml);
  console.log(`✅ Saved to: ${templatePath}`);

  // 3. Final Reminder Email
  console.log('Rendering FinalReminderEmail...');
  const finalHtml = await render(
    FinalReminderEmail({
      userName,
      quickStartUrl: 'https://brandforge.me/quick-start',
      userEmail: 'sarah@example.com',
    })
  );
  const finalPath = path.join(previewDir, '3-final-reminder-email.html');
  fs.writeFileSync(finalPath, finalHtml);
  console.log(`✅ Saved to: ${finalPath}`);

  console.log('\n========================================');
  console.log('✅ All email previews generated!');
  console.log('========================================');
  console.log('\nLocation:', previewDir);
  console.log('\nOpen these files in your browser to preview:');
  console.log('  - 1-example-showcase-email.html');
  console.log('  - 2-template-showcase-email.html');
  console.log('  - 3-final-reminder-email.html');
  console.log('\n⚠️  Note: Images use local paths /showcase/...');
  console.log('    Make sure you have a local server running on port 3000');
  console.log('    or the images won\'t display.');
}

generatePreviews();
