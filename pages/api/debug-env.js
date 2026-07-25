export default async function handler(req, res) {
  // Show us exactly what environment variables are available
  const envCheck = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? '✅ Present (length: ' + process.env.R2_ACCOUNT_ID.length + ')' : '❌ Missing/Undefined',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ Present (length: ' + process.env.R2_ACCESS_KEY_ID.length + ')' : '❌ Missing/Undefined',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ Present (length: ' + process.env.R2_SECRET_ACCESS_KEY.length + ')' : '❌ Missing/Undefined',
    
    // Also check for common variations
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? '✅ Present' : '❌ Missing',
    R2_ACCOUNT_KEY: process.env.R2_ACCOUNT_KEY ? '✅ Present' : '❌ Missing',
    R2_ACCESS_KEY: process.env.R2_ACCESS_KEY ? '✅ Present' : '❌ Missing',
  };

  res.status(200).json({
    message: 'Environment Variable Check',
    variables: envCheck,
    timestamp: new Date().toISOString()
  });
}
