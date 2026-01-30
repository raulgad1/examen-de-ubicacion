# English Center Test - Interactive Quiz Application

An interactive web-based English proficiency test with 80 questions across 8 levels (A1 to C1+).

## Features

- **80 Questions**: Comprehensive test covering 8 proficiency levels
- **Level Progression**: Users must score 7/10 or higher to advance to the next level
- **Modern UI**: Responsive design with smooth animations and transitions
- **Progress Tracking**: Real-time progress indicators and level tracking
- **Email Results**: Automatic email submission of test results
- **Mobile Friendly**: Works seamlessly on desktop, tablet, and mobile devices

## Project Structure

```
final/
├── index.html              # Main application file
├── css/
│   └── styles.css          # All styling and animations
├── js/
│   ├── quiz.js             # Quiz logic and scoring
│   └── email.js            # Email functionality
├── assets/
│   └── logo sin fondo.gif  # English Center logo
├── questions/
│   └── quiz_questions.json # Question bank (80 questions)
└── README.md               # This file
```

## How to Use

### Running the Application

1. Open `index.html` in a modern web browser
2. Fill in your name, email, and phone number (optional)
3. Click "Start Test" to begin
4. Answer all 80 questions
5. View your results and final English level

### Level System

- **Level 1**: A1 - Beginner
- **Level 2**: A2 - Elementary
- **Level 3**: B1 - Intermediate
- **Level 4**: B1+ - Upper Intermediate
- **Level 5**: B2 - Upper Intermediate
- **Level 6**: B2+ - Advanced
- **Level 7**: C1 - Advanced
- **Level 8**: C1+ - Proficient

### Scoring Logic

- Each level contains 10 questions
- Users must score 7 or more correct answers to pass a level
- Final level = highest level where user scored 7+ correct answers
- If a user scores less than 7 on Level 1, they are classified as Pre-A1

## Email Configuration

The application uses EmailJS to send results to `test@englishcenter.mx`.

### Setup EmailJS (Optional)

1. Sign up for a free account at [https://www.emailjs.com/](https://www.emailjs.com/)
2. Add an email service (Gmail, Outlook, etc.)
3. Create an email template with these variables:
   - `{{user_name}}`
   - `{{user_email}}`
   - `{{user_phone}}`
   - `{{final_level}}`
   - `{{level_description}}`
   - `{{total_correct}}`
   - `{{total_questions}}`
   - `{{overall_score}}`
   - `{{level_breakdown}}`
   - `{{test_date}}`
4. Get your Public Key, Service ID, and Template ID
5. Update the configuration in `js/email.js`:
   ```javascript
   const EMAIL_CONFIG = {
       publicKey: 'YOUR_PUBLIC_KEY_HERE',
       serviceId: 'YOUR_SERVICE_ID_HERE',
       templateId: 'YOUR_TEMPLATE_ID_HERE',
       recipientEmail: 'test@englishcenter.mx'
   };
   ```

### Fallback Option

If EmailJS is not configured, the application will provide a "mailto" link that opens the user's default email client with pre-filled content.

## Technical Details

### Technologies Used

- **HTML5**: Semantic markup with accessibility considerations
- **CSS3**: Modern styling with animations and responsive design
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Vanilla JavaScript**: No framework dependencies
- **EmailJS**: Client-side email service

### Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Key Features Implementation

1. **Question Loading**: Asynchronously loads questions from JSON file
2. **State Management**: Tracks user progress, answers, and scores
3. **Level Calculation**: Automatically determines final level based on performance
4. **Responsive Design**: Adapts to all screen sizes
5. **Smooth Transitions**: CSS animations for better UX
6. **Error Handling**: Graceful fallbacks for network issues

## Customization

### Changing Questions

Edit `questions/quiz_questions.json` to modify questions. Each question should have:
```json
{
  "id": 1,
  "question": "Question text here?",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 0
}
```

### Styling

Modify `css/styles.css` to change colors, fonts, or layout. CSS variables are defined at the top:
```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    /* ... more variables */
}
```

### Passing Score

To change the passing score (currently 7/10), modify the logic in `js/quiz.js`:
```javascript
const passed = correctCount >= 7; // Change 7 to desired score
```

## Support

For issues or questions, contact: test@englishcenter.mx

## License

© 2026 English Center. All rights reserved.
