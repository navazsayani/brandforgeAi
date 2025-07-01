# BrandForge AI - Technical Blueprint

This document provides a detailed technical overview of the BrandForge AI application, intended for developers and technical stakeholders.

## 1. High-Level Architecture

BrandForge AI is a modern web application built on a Next.js and Firebase stack. It leverages server-side rendering, server actions, and a suite of Google Cloud services to deliver a responsive user experience and powerful AI capabilities.

**Core Components:**

1.  **Frontend:** A Next.js 15 application using the App Router, React 19, and TypeScript. UI is built with ShadCN components and styled with Tailwind CSS.
2.  **Backend Logic:** Handled primarily through Next.js Server Actions, which encapsulate server-side logic and database operations.
3.  **AI Orchestration:** Google's **Genkit** framework is used to define, manage, and execute all AI-related workflows (flows). This provides a structured way to interact with various AI models.
4.  **Database:** **Cloud Firestore** is the primary NoSQL database for storing user data, brand profiles, and all generated content.
5.  **File Storage:** **Firebase Storage** is used for storing user-uploaded assets like example images and generated brand logos.
6.  **Authentication:** **Firebase Authentication** manages user sign-up, login (email/password and Google), and session management.
7.  **Hosting:** The application is deployed on **Firebase App Hosting**.

See the [High-Level Design Document](./HIGH_LEVEL_DESIGN.md) for a visual diagram of the architecture.

## 2. Technical Stack

| Category      | Technology/Service                                      | Purpose                                                    |
| :------------ | :------------------------------------------------------ | :--------------------------------------------------------- |
| **Framework**   | Next.js 15 (App Router)                                 | Full-stack web framework, routing, server components       |
| **Language**    | TypeScript                                              | Type safety and improved developer experience              |
| **UI Library**  | React 19                                                | Core UI library                                            |
| **UI Components** | ShadCN UI                                               | Accessible, and unstyled component primitives            |
| **Styling**     | Tailwind CSS                                            | Utility-first CSS framework                                |
| **State Mgt**   | React Context API, `useActionState`                     | Managing global (Auth, Brand) and form state             |
| **AI SDK**      | Genkit                                                  | Orchestrating AI flows, prompts, and model interactions    |
| **AI Models**   | Google AI (Gemini family, Imagen)                       | Text generation, vision analysis, and image generation     |
| **Database**    | Cloud Firestore (NoSQL)                                 | Storing user data, brand profiles, and generated content   |
| **Auth**        | Firebase Authentication                                 | User identity and session management                       |
| **Storage**     | Firebase Storage                                        | Storing user-uploaded files and generated logos          |
| **Deployment**  | Firebase App Hosting                                    | Managed hosting for Next.js applications                 |

## 3. Project Structure

The `src` directory is organized to separate concerns:

-   `/app`: Contains all pages and layouts, following the Next.js App Router convention.
    -   `/(authenticated)`: Layout and pages for logged-in users.
    -   `/(legal)`: Layout and pages for legal documents (Terms, Privacy).
    -   `/login`, `/signup`: Authentication pages.
    -   `/api`: Server-side API routes (e.g., for OAuth callbacks).
-   `/ai`: Home for all Genkit-related code.
    -   `/flows`: Contains individual Genkit flow definitions (e.g., `generate-images.ts`, `generate-blog-content.ts`). Each flow is a self-contained AI task.
    -   `/tools`: Reusable Genkit tools, like the website scraper (`fetch-website-content-tool.ts`).
    -   `genkit.ts`: Initializes the global Genkit instance.
-   `/components`: Reusable React components.
    -   `/ui`: Auto-generated ShadCN UI components.
    -   `AppShell.tsx`, `SubmitButton.tsx`, etc.
-   `/contexts`: Global state management using React Context.
    -   `AuthContext.tsx`: Manages user authentication state.
    -   `BrandContext.tsx`: Manages the current user's brand data and session-level generated content.
-   `/hooks`: Custom React hooks, such as `useToast`.
-   `/lib`: Core application logic, constants, and configuration.
    -   `actions.ts`: **Server Actions**. This is the bridge between the frontend and backend/AI logic.
    -   `firebaseConfig.ts`: Firebase initialization.
    -   `model-config.ts`, `plans-config.ts`: Fetches dynamic configuration from Firestore.
    -   `constants.ts`: Application-wide constants (e.g., industry lists, plan details).
-   `/types`: TypeScript type definitions.

## 4. Core Workflows

### User Authentication
1.  A user interacts with `LoginForm.tsx` or `SignupForm.tsx`.
2.  The form calls a method from `AuthContext` (e.g., `logIn`, `signUp`).
3.  `AuthContext` uses the Firebase Auth SDK to handle the authentication request.
4.  A `useEffect` hook in `AuthenticatedLayout.tsx` listens for auth state changes and redirects unauthorized users to `/login`.

### AI Content Generation (e.g., Blog Post)
1.  **Client-Side (`content-studio/page.tsx`):** A user fills a form and clicks "Generate".
2.  **Form Submission:** The form submission triggers a **Server Action** defined in `lib/actions.ts` (e.g., `handleGenerateBlogContentAction`).
3.  **Server Action (`lib/actions.ts`):**
    -   Receives the `FormData`.
    -   Performs validation and authorization checks.
    -   Constructs an input object for the corresponding Genkit flow.
    -   Calls the Genkit flow function (e.g., `generateBlogContent()`).
4.  **Genkit Flow (`ai/flows/generate-blog-content.ts`):**
    -   The flow is defined using `ai.defineFlow`.
    -   It might call a Genkit tool (like `fetchWebsiteContentTool`) to gather more context.
    -   It defines a structured prompt using `ai.definePrompt`, which includes Zod schemas for input and output validation.
    -   It calls the AI model (Gemini) via the prompt object.
    -   It returns the structured, validated output to the Server Action.
5.  **Back to Server Action:**
    -   Receives the AI-generated data.
    -   Saves the generated content to the appropriate Firestore collection (e.g., `users/{userId}/brandProfiles/{userId}/blogPosts`).
    -   Returns a structured state object (data or error) to the client.
6.  **Back to Client-Side:**
    -   The `useActionState` hook receives the state from the server action.
    -   The UI updates to display the generated content or an error message.

## 5. Database Schema (Firestore)

-   **`users/{userId}`**
    -   A top-level document for each user, primarily for organizing subcollections.
    -   **Subcollection: `brandProfiles/{userId}`**
        -   Stores the user's `BrandData` (name, description, logo URL, plan details, etc.). There is only one document in this subcollection, with the same ID as the user.
    -   **Subcollection: `savedLibraryImages/{imageId}`**
        -   Stores metadata for AI-generated images saved by the user.
    -   **Subcollection: `socialMediaPosts/{postId}`**
        -   Stores generated social media posts.
    -   **Subcollection: `blogPosts/{blogId}`**
        -   Stores generated blog posts.
    -   **Subcollection: `adCampaigns/{campaignId}`**
        -   Stores generated ad campaigns.

-   **`configuration/{docId}`**
    -   A collection for system-wide configuration.
    -   `models`: Stores the names of the AI models to use.
    -   `plans`: Stores pricing and feature details for subscription plans.

-   **`userIndex/profiles`**
    -   A single document used as an index for fast lookup of all user profiles by an admin. Maps `userId` to `brandName` and `userEmail`.

## 6. Environment Variables

The application requires the following environment variables to be set in a `.env.local` file:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Payment Gateway (Razorpay)
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID_TEST=...
RAZORPAY_KEY_SECRET_TEST=...

# Image Generation Providers
FREEPIK_API_KEY=...
```

## 7. Getting Started for Developers

1.  **Prerequisites:** Node.js (v18+), npm/yarn.
2.  **Clone the repository.**
3.  **Install dependencies:** `npm install`
4.  **Set up Firebase:**
    -   Create a Firebase project.
    -   Enable Authentication (Email/Password, Google), Firestore, and Storage.
    -   Copy your Firebase project configuration into the `.env.local` file.
5.  **Set up API Keys:**
    -   Add API keys for Razorpay and Freepik to `.env.local`.
    -   Ensure your Google AI API key is configured for Genkit (typically via `gcloud auth application-default login`).
6.  **Run the development server:** `npm run dev`
7.  **Access the app:** Open `http://localhost:9002` in your browser.