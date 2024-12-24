# Setting Up Custom Domain and Email Sending with Clerk

This guide explains how to set up a custom domain for authentication and configure custom email sending in Clerk.

## Domain Verification

### 1. Add Your Domain

1. Go to Clerk Dashboard
2. Navigate to Domains & URLs
3. Click "Add domain"
4. Enter your domain (e.g., `applymate.app`)

### 2. DNS Configuration

Add these DNS records to your domain:

```
# Domain verification
Type: TXT
Name: _clerk
Value: clerk-domain-verification=<your-verification-code>

# Email authentication (if using custom email sending)
Type: TXT
Name: @
Value: v=spf1 include:spf.clerk.com ~all

Type: CNAME
Name: clerk-mail._domainkey
Value: clerk-mail.clerk.com

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 3. Verify Domain

1. After adding DNS records, click "Verify domain"
2. Clerk will check for the presence of the verification record
3. If successful, your domain is now verified

## Email Configuration

### 1. Email Settings

1. Go to Email & SMS > Settings
2. Configure sender details:
   ```
   From name: ApplyMate
   From email: notifications@applymate.app
   Reply-to: support@applymate.app
   ```

### 2. DMARC Setup

Create a DMARC policy file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feedback>
  <version>1.0</version>
  <report_metadata>
    <org_name>ApplyMate</org_name>
    <email>dmarc@applymate.app</email>
    <extra_contact_info>https://applymate.app/support</extra_contact_info>
    <report_id>2024-01</report_id>
  </report_metadata>
  <policy_published>
    <domain>applymate.app</domain>
    <adkim>r</adkim>
    <aspf>r</aspf>
    <p>quarantine</p>
    <sp>quarantine</sp>
    <pct>100</pct>
  </policy_published>
</feedback>
```

### 3. Testing Email Setup

1. **Send Test Emails**
   ```bash
   # Using mail-tester.com
   curl -X POST "https://api.clerk.dev/v1/email/test" \
     -H "Authorization: Bearer ${CLERK_SECRET_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@mail-tester.com",
       "subject": "Test Email",
       "body": "This is a test email"
     }'
   ```

2. **Check Authentication**
   ```bash
   # Check SPF record
   dig TXT applymate.app

   # Check DKIM record
   dig TXT clerk-mail._domainkey.applymate.app

   # Check DMARC record
   dig TXT _dmarc.applymate.app
   ```

## Production Setup

### 1. Environment Configuration

Update your production environment variables:
```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Custom Domain
VITE_CLERK_DOMAIN=auth.applymate.app
VITE_APP_DOMAIN=applymate.app
```

### 2. Application URLs

Configure these URLs in Clerk Dashboard:
```
Sign-in URL: https://applymate.app/sign-in
Sign-up URL: https://applymate.app/sign-up
After sign-in URL: https://applymate.app/jobs
After sign-up URL: https://applymate.app/onboarding
```

### 3. Security Headers

Add these security headers to your server:

```nginx
# Nginx configuration
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https://*.clerk.com; frame-ancestors 'none';" always;
```

## Monitoring

### 1. Email Metrics

Monitor these metrics in Clerk Dashboard:
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Spam reports

### 2. Domain Health

Regular checks:
- SSL certificate validity
- DNS record integrity
- DMARC reports
- SPF/DKIM alignment

### 3. Error Tracking

Set up alerts for:
- Failed deliveries
- Authentication failures
- Domain verification issues
- Rate limiting

## Troubleshooting

### Common Issues

1. **Domain Verification Failed**
   - Check DNS propagation
   - Verify record format
   - Wait for TTL

2. **Email Delivery Issues**
   - Check SPF alignment
   - Verify DKIM signing
   - Review DMARC policy

3. **Authentication Errors**
   - Check domain configuration
   - Verify SSL certificates
   - Review CORS settings

### Debug Steps

1. **Check DNS Records**
   ```bash
   # Domain verification
   dig TXT _clerk.applymate.app

   # Email authentication
   dig TXT applymate.app
   dig TXT clerk-mail._domainkey.applymate.app
   ```

2. **Test Email Flow**
   ```bash
   # Send test email
   curl -X POST "https://api.clerk.dev/v1/email/test" \
     -H "Authorization: Bearer ${CLERK_SECRET_KEY}" \
     -d '{"to":"test@example.com"}'

   # Check delivery status
   curl -X GET "https://api.clerk.dev/v1/email/status/${EMAIL_ID}" \
     -H "Authorization: Bearer ${CLERK_SECRET_KEY}"
   ```

3. **Verify SSL**
   ```bash
   # Check SSL certificate
   openssl s_client -connect applymate.app:443 -servername applymate.app
   ```

## Best Practices

1. **Email Deliverability**
   - Warm up IP addresses
   - Monitor engagement metrics
   - Handle bounces properly
   - Follow anti-spam guidelines

2. **Security**
   - Use strong DMARC policy
   - Enable DNSSEC
   - Regular security audits
   - Monitor for abuse

3. **Maintenance**
   - Regular DNS checks
   - Certificate renewal
   - Policy updates
   - Performance monitoring
