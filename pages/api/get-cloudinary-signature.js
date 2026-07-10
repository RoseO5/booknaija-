import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const timestamp = Math.round((new Date).getTime() / 1000);
  const folder = 'booknaija/covers';
  
  // Generate secure signature for direct upload
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    folder
  }, process.env.CLOUDINARY_API_SECRET);

  res.status(200).json({ 
    signature, 
    timestamp, 
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    folder
  });
}
