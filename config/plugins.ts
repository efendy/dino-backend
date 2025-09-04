export default ({ env }) => ({
  upload: {
    config: {
      breakpoints: {
        small: 256,
        medium: 512,
        large: 1024,
      },
      ...(env('NODE_ENV') === 'production'
        ? {
            baseUrl: env('CDN_URL'),
            rootPath: env('CDN_ROOT_PATH', ''),
            provider: 'aws-s3',
            providerOptions: {
              endpoint: env('STORAGE_ENDPOINT'),
              region: env('STORAGE_REGION'),
              credentials: {
                accessKeyId: env('STORAGE_KEY'),
                secretAccessKey: env('STORAGE_SECRET'),
              },
              params: {
                Bucket: env('STORAGE_BUCKET'),
              },
            },
          }
        : {
            provider: 'local',
            providerOptions: {
              sizeLimit: 10 * 1024 * 1024, // 10 MB
            },
          }),
    },
  },
});
