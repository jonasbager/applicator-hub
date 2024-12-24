# Customizing Email Templates in Clerk

This guide explains how to customize email templates for authentication flows in Clerk.

## Available Email Types

1. **Welcome Email**
   - Sent when a new user signs up
   - Introduces your app and next steps

2. **Verification Email**
   - Sent to verify email addresses
   - Contains verification code/link

3. **Reset Password**
   - Sent when user requests password reset
   - Contains reset link/code

4. **Magic Link**
   - Sent for passwordless sign-in
   - Contains one-time sign-in link

## Template Customization

### 1. Access Email Templates

1. Go to Clerk Dashboard
2. Navigate to Email & SMS > Email templates
3. Select the template you want to customize

### 2. Template Variables

Common variables available in all templates:
```
{{application_name}} - Your app name
{{user_name}} - User's full name
{{user_first_name}} - User's first name
{{user_last_name}} - User's last name
{{user_email}} - User's email address
{{action_url}} - Verification/reset/magic link
{{code}} - Verification code (if enabled)
{{organization_name}} - Current organization name (if applicable)
{{support_email}} - Your support email
```

### 3. Example Templates

#### Welcome Email
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0891b2;
      color: white;
      text-decoration: none;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to {{application_name}}!</h1>
    <p>Hi {{user_first_name}},</p>
    <p>Thanks for signing up. We're excited to help you manage your job applications more effectively.</p>
    <p>To get started:</p>
    <ol>
      <li>Add your first job application</li>
      <li>Set up job status tracking</li>
      <li>Enable notifications</li>
    </ol>
    <p>
      <a href="{{action_url}}" class="button">Get Started</a>
    </p>
    <p>Need help? Reply to this email or contact us at {{support_email}}.</p>
  </div>
</body>
</html>
```

#### Verification Email
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .code {
      font-size: 32px;
      letter-spacing: 4px;
      font-family: monospace;
      background: #f1f5f9;
      padding: 12px;
      border-radius: 6px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0891b2;
      color: white;
      text-decoration: none;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verify your email</h1>
    <p>Hi {{user_first_name}},</p>
    <p>Please verify your email address by entering this code:</p>
    <p class="code">{{code}}</p>
    <p>Or click the button below:</p>
    <p>
      <a href="{{action_url}}" class="button">Verify Email</a>
    </p>
    <p>This link will expire in 30 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>
```

### 4. Best Practices

1. **Design Guidelines**
   - Use responsive design
   - Keep it simple and clean
   - Test across email clients
   - Use web-safe fonts

2. **Content Guidelines**
   - Clear call to action
   - Brief and focused message
   - Include support contact
   - Explain next steps

3. **Technical Guidelines**
   - Use inline CSS
   - Test with different devices
   - Keep images minimal
   - Include plain text version

## Testing Templates

1. **Send Test Emails**
   - Use Clerk's test mode
   - Send to different email clients
   - Check mobile rendering

2. **Test Variables**
   - Verify all variables render
   - Check fallback values
   - Test with long values

3. **Test Links**
   - Verify all links work
   - Check link tracking
   - Test expiration times

## Production Checklist

1. **Before Launch**
   - Test all templates
   - Verify sender domain
   - Check spam score
   - Set up tracking

2. **Monitoring**
   - Track delivery rates
   - Monitor bounce rates
   - Check spam reports
   - Review analytics

3. **Maintenance**
   - Regular template updates
   - A/B test variations
   - Update branding as needed
   - Review engagement metrics

## Troubleshooting

### Common Issues

1. **Email Not Received**
   - Check spam folder
   - Verify email address
   - Check sending limits
   - Review logs in Clerk

2. **Template Issues**
   - Variable not rendering
   - Styling problems
   - Link not working
   - Image not showing

### Debug Steps

1. Check Clerk logs
2. Test in multiple clients
3. Verify DNS settings
4. Review spam score

## Next Steps

1. Set up custom domain
2. Implement tracking
3. Create A/B tests
4. Monitor metrics
