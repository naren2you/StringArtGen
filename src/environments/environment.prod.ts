export const environment = {
  production: true,
  apiUrl: 'https://api.stringartgen.com/api', // Replace with your production API URL
  appName: 'StringArtGen',
  version: '1.0.0',
  debug: false,
  features: {
    auth: true,
    stringArtGeneration: true,
    projectManagement: true,
    publicGallery: true,
    exportOptions: true
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxNails: 512,
    minNails: 50,
    maxStrings: 3000,
    minStrings: 100,
    maxTags: 10,
    maxTitleLength: 100,
    maxDescriptionLength: 500
  },
  defaults: {
    nails: 256,
    strings: 2000,
    algorithm: 'greedy',
    color: 'black',
    blurRadius: 1,
    contrast: 1
  }
}; 