# Local Image Finder

A cross-platform desktop application for intelligent local image search and management, similar to Microsoft's Gallery app. This application leverages advanced AI technologies to provide powerful search capabilities, intuitive organization, and seamless browsing of your local image collection.

## Features

### Intelligent Search
- **AI-Powered Search**: Use natural language queries to find images based on content, context, and metadata
- **Visual Search**: Search by uploading reference images to find visually similar photos
- **Vector Embeddings**: Utilizes NLP and VLM models to create and compare vector representations of images

### Profile Management
- **Multiple User Profiles**: Support for different users with personalized settings and preferences
- **Data Segregation**: Each profile maintains separate history, settings, and collections

### Intuitive Organization
- **Chat-Style Search Interface**: Conversational search experience with history
- **Library Management**: View, organize, and manage past search sessions
- **Smart Albums**: Create albums manually or automatically based on search criteria

### Advanced Management
- **Batch Operations**: Perform actions on multiple images or albums simultaneously
- **File Integration**: Open images in native viewers and access file properties
- **Export & Share**: Share search results or entire albums with others

## Core Pages

### Chat/Search Page
The main interface for querying your image collection, featuring:
- Advanced search bar for text and image inputs
- Real-time result updates as images change on disk
- Hierarchical display of search results by relevance

### Library Page
Manages your search history and saved sessions:
- Visual representation of past searches with previews
- Quick filtering and sorting options
- Easy resumption of previous search contexts

### Albums Page
Organize and curate your image collection:
- Create custom albums based on search criteria
- View automatically generated collections
- Batch manage albums with intuitive controls

### Settings Page
Customize your experience:
- Configure monitored folders for image indexing
- Adjust search parameters and result thresholds
- Select theme preferences and UI options
- Fine-tune AI model performance settings

## Technical Stack

- **Frontend**: ElectronJS, React, Radix UI, Redux
- **Backend**: Python, FastAPI
- **Data Storage**: ChromaDB for vector embeddings and metadata
- **AI Models**: Integrated NLP for text understanding and VLM for image processing

## Privacy-First Approach

- All processing happens locally on your device
- No data is sent to external servers
- Your images remain private and secure

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.10+)
- Electron

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/local-image-finder.git
cd local-image-finder
```

2. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Start the application
```bash
npm run start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.