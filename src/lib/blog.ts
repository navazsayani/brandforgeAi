
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// The directory where your markdown blog posts are stored
const postsDirectory = path.join(process.cwd(), 'src/content/blog');

export interface BlogPostMetadata {
  title: string;
  date: string;
  author: string;
  excerpt: string;
  image: string; // Path to the cover image
  tags: string[];
}

export interface BlogPost extends BlogPostMetadata {
  slug: string;
  content: string;
}

export function getBlogPosts(): BlogPost[] {
  try {
    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        // Remove ".md" from file name to get the slug
        const slug = fileName.replace(/\.md$/, '');

        // Read markdown file as string
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        // Use gray-matter to parse the post metadata section
        const matterResult = matter(fileContents);

        // Combine the data with the slug
        return {
          slug,
          content: matterResult.content,
          ...(matterResult.data as BlogPostMetadata),
        };
      });

    // Sort posts by date in descending order
    return allPostsData.sort((a, b) => {
      if (new Date(a.date) < new Date(b.date)) {
        return 1;
      } else {
        return -1;
      }
    });
  } catch (error) {
    // If the directory doesn't exist, return an empty array.
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.warn("Blog content directory 'src/content/blog' not found. Returning empty list.");
      return [];
    }
    // For other errors, re-throw them.
    throw error;
  }
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const allPosts = getBlogPosts();
  return allPosts.find((post) => post.slug === slug);
}
