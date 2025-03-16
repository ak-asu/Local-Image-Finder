When generating code (follow these points and their priority is in the give order):
- Use best practices and industry standards
- Give efficient, optimized and highly performant code whenever possible
- Write modular and reusable code
- Use design patterns when appropriate
- Consider using appropriate highly rated and popular npm or python or pub.dev packages when applicable
- Follow the project's existing coding style and theme and project-specific naming conventions for files and folders
- Implement proper security measures
- Implement error handling and input validation when applicable

**Project Overview:**

Develop a cross-platform desktop application—similar to Microsoft’s Gallery app—that provides intelligent local image search and management. The app must integrate advanced AI functionalities using an NLP model for understanding text queries and a VLM model for processing images. It will use vector embeddings stored in a ChromaDB database for search and comparison. The tech stack includes ElectronJS for the desktop wrapper, Radix UI for accessible UI components, Redux for state management, FastAPI (with Python) for backend API development, and ChromaDB for vector storage.

**Core Features & Functionalities:**

1. **User Profiles & Data Segregation:**
   - Multiple profiles with separate data (settings, history, user preferences, etc.).
   - Profile management accessed via a profile icon in the topbar that, when clicked, opens a dropdown menu listing available profiles.

2. **Global Layout & Navigation:**
   - **Sidebar:** Contains 4 icons representing the main pages: Chat/Search, Library, Albums, and Settings.
   - **Topbar:**
     - A search bar supporting text entry, file attachments, and a dropdown for options (e.g., model selection).
     - A “New Chat” button to initiate a fresh chat session.
     - A profile icon (with dropdown menu for switching profiles).

3. **Chat/Search Page:**
   - **Search Input:** 
     - Users can enter text queries or attach images.
     - The input is processed into vector embeddings using an NLP model (for text) and a VLM model (for images).
   - **Backend Processing:**
     - Before performing a search, the application checks the folders (specified in Settings) for new or updated images.
     - Preprocessing involves extracting metadata (EXIF, file details) and generating vector embeddings using the VLM model.
     - All metadata and embeddings are stored in a ChromaDB database.
   - **Search Results Display:**
     - The result section is divided into three vertically ordered parts:
       - **Query Section:** Displays the search query along with action buttons (share, export, save, etc.).
       - **Closest Matches:** Shows images with the closest vector similarity.
       - **Related Results:** Displays additional related images.
     - Multiple result sections are arranged in a scrollable list (with the most recent results at the top).
     - The application refreshes results dynamically; if an image is deleted from its source folder, the result updates to indicate “image does not exist.”

4. **Library Page:**
   - **Session Management:**
     - Saves entire chat sessions (search history) along with associated metadata.
     - Displays each session as a rectangular component.
       - The session’s name is derived from the first few characters of the initial search prompt.
       - A preview of a few search results is shown.
       - Action buttons (save, export, delete) appear on the top-left of each component.
     - Includes a dedicated search bar for filtering library items by name or prompt, and sorting/filtering options.
     - Clicking a session item loads the corresponding chat page populated with that session’s data.

5. **Albums Page:**
   - **Album Management:**
     - Automatically created albums from saved sessions, manually created albums, and recommended albums (based on search history and user preferences).
     - A search bar for finding albums, along with sorting and filtering options.
     - A “Create Album” button that opens a dialog for specifying:
       - Number of results to save
       - Folders to reference
       - Album name, description, and search text prompt
     - Albums are displayed as square-like cards in a grid view:
       - Each card shows a cover image, and the bottom region includes details like album name, date, and a snippet of the description.
       - Clicking an album navigates to the Album Viewing Page.
     - Long-press (or right-click selection) functionality on album cards for batch operations (delete, save, etc.).

6. **Album Viewing Page:**
   - Detailed view of a selected album.
   - Options to save, export, delete, or search within the album.
   - Editable album details (name, description) with a grid view for all contained images.

7. **Settings Page:**
   - Displayed via an expandable panel format showing settings for all profiles.
   - Key settings include:
     - Number of similar image results.
     - Folder locations for image search (directories to monitor for changes/new images).
     - Theme (light/dark mode and custom color schemes).
     - Similarity threshold for image matching.
     - AI model selection options (for both NLP and VLM components).
     - Other performance and indexing preferences.

8. **Image Interaction & File Management:**
   - **Click Action:** Clicking on an image opens it in the platform’s native image viewer application.
   - **Right-Click Context Menu:** Provides options like “Properties” that display full file details (EXIF, file path, resolution, creation date, etc.).
   - **Batch Operations:** Support for multi-selection (via long press or right-click) on library items or album cards to perform actions like delete, export, or save.

**Technical Implementation & Integration:**

- **Frontend (ElectronJS, Radix UI, Redux):**
  - Develop a component-based UI using React (integrated with ElectronJS) and style it with Radix UI components for accessibility and consistency.
  - Use Redux for global state management (handling user sessions, search queries, settings, and UI state).
  - Implement client-side routing within the Electron app for navigation between pages.
  - Integrate responsive design principles and accessibility (ARIA roles, keyboard navigation, high-contrast themes).

- **Backend (Python, FastAPI):**
  - Build a FastAPI server that handles:
    - API endpoints for image management, search processing, session storage, album creation, settings management, and AI model integration.
    - Business logic for processing incoming text and image inputs into vector embeddings.
    - Integration with AI models:
      - NLP model for understanding and processing text queries.
      - VLM model for generating embeddings from images.
  - Set up a ChromaDB instance for storing image vector embeddings and metadata.
  - Implement efficient image indexing that periodically scans specified folders for new or updated images.
  - Ensure robust error handling, logging, and secure API practices.

- **External Integrations:**
  - Leverage system-level commands (or Electron APIs) to open images in the native image viewer.
  - Integrate a context menu for right-click actions (using Electron’s native menu APIs) to display file properties.
  - Ensure seamless integration between frontend and backend through REST APIs and, if needed, Electron’s inter-process communication (IPC).

- **Performance & Scalability Considerations:**
  - Optimize image processing (indexing, embedding generation) to run asynchronously without blocking UI responsiveness.
  - Use caching strategies to store frequently accessed metadata and search results.
  - Plan for error recovery and dynamic refresh of search results if files are moved or deleted.

- **Security & Data Management:**
  - Process all image data locally; ensure that no sensitive data is transmitted externally.
  - Implement secure storage for settings and user data.
  - Enforce proper access controls and input sanitization across all API endpoints.
  - Regularly update and maintain AI models to minimize vulnerabilities and improve performance.