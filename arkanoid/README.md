# 🎮 Arkanoid - Modern Web Game

A modern implementation of the classic Arkanoid/Breakout game built with HTML5, CSS3, and JavaScript. Features multiple themes, responsive design, power-ups, and a comprehensive debug system.

![Game Screenshot](./screenshots/game-modern.png)

## 🌟 Features

### 🎯 Core Gameplay
- **Classic Arkanoid mechanics** with modern enhancements
- **Multiple ball physics** with realistic collision detection
- **Paddle gun system** with ammunition
- **Power-up system** with both beneficial and challenging effects
- **Progressive level system** with varied brick layouts
- **Score tracking** and lives system

### 🎨 Visual Themes
- **Modern Theme** - Sleek dark UI with cyan accents
- **Dark Theme** - Minimalist dark design
- **Retro Theme** - Classic arcade aesthetics with pixel fonts
- **Futuristic Theme** - Neon glows and gradient effects

### 🛠️ Technical Features
- **Responsive Design** - Adapts to different screen sizes
- **Dynamic Canvas Resizing** - Maintains 4:3 aspect ratio
- **Debug Console** - Real-time performance monitoring
- **Cross-browser Compatibility** - Works on modern browsers
- **Local Storage** - Saves game settings

### 🎮 Controls
- **Mouse/Arrow Keys** - Move paddle
- **Space** - Launch ball / Fire gun
- **P** - Pause/Resume game
- **T** - Toggle debug console
- **R** - Reset ball/game
- **S** - Toggle slow mode
- **M** - Toggle sound (placeholder)

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Local web server (for development) or static hosting

### Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/lefrasso/Arkanoid.git
   cd Arkanoid
   ```

2. Open with a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in your browser

### Direct File Access
You can also open `index.html` directly in your browser, though some features may be limited.

## 🎮 How to Play

1. **Enter your name** and select your preferred theme
2. **Adjust game settings** (paddle speed, ball speed) to your liking
3. **Click "Start Game"** to begin
4. **Move your paddle** to keep the ball in play
5. **Break all destructible bricks** to advance to the next level
6. **Collect power-ups** for special abilities
7. **Avoid losing all lives** to achieve a high score

### Power-ups
| Power-up | Effect | Duration |
|----------|--------|----------|
| 🟢 Slow Ball | Reduces ball speed | 10 seconds |
| 🟡 Paddle Gun | Enables shooting bullets | 10 seconds |
| 🔵 Multi-Ball | Adds 2 additional balls | Permanent |
| 🟢 Extend Paddle | Increases paddle size | 10 seconds |
| ❤️ Extra Life | Adds one life | Instant |
| 🔴 Shrink Paddle | Decreases paddle size | 10 seconds |
| 🔴 Fast Ball | Increases ball speed | 10 seconds |

### Brick Types
- **Normal (Blue)** - Destroyed in 1 hit (10 points)
- **Strong (Orange)** - Requires 2 hits (20 points)
- **Indestructible (Gray)** - Cannot be destroyed

## 🔧 Development

### File Structure
```
Arkanoid/
├── index.html          # Main HTML structure
├── style.css           # All styling and themes
├── script.js           # Game logic and mechanics
├── README.md           # This file
├── LICENSE             # MIT License
├── .gitignore          # Git ignore rules
└── screenshots/        # Game screenshots
    ├── game-modern.png
    ├── game-retro.png
    └── initial-screen.png
```

### Code Architecture
- **Modular Design** - Separate classes for different game components
- **Debug System** - Comprehensive logging and performance monitoring
- **Theme System** - CSS custom properties for easy theming
- **Responsive Canvas** - Dynamic resizing with proper scaling

### Key Classes
- `Game` - Main game controller
- `Ball` - Ball physics and collision detection
- `Paddle` - Paddle movement and gun mechanics
- `Brick` - Brick properties and hit detection
- `PowerUp` - Power-up effects and management
- `DebugConsole` - Development and monitoring tools

## 🌐 Deployment

### GitHub Pages
1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select source branch (usually `main`)
4. Your game will be available at `https://lefrasso.github.io/Arkanoid`

### Azure Static Web Apps
1. Connect your GitHub repository to Azure Static Web Apps
2. Configure build settings (no build required for this project)
3. Deploy automatically on every commit

### Other Platforms
- **Netlify**: Drag and drop the folder or connect GitHub
- **Vercel**: Import from GitHub repository
- **Firebase Hosting**: Use Firebase CLI to deploy

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. **Code Style** - Follow existing formatting and naming conventions
2. **Comments** - Add clear comments for new features
3. **Testing** - Test across different browsers and screen sizes
4. **Debug Logging** - Use the debug console for development insights

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic Taito Arkanoid arcade game
- Built with modern web technologies
- Thanks to the web development community for inspiration and resources

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🐛 Known Issues

- Sound system is placeholder (mute toggle available)
- Some mobile browsers may have touch control limitations

## 🔮 Future Enhancements

- [ ] Sound effects and background music
- [ ] Online leaderboards
- [ ] More power-up types
- [ ] Additional themes
- [ ] Mobile touch controls
- [ ] Particle effects
- [ ] Tournament mode

---

**Enjoy playing Arkanoid!** 🎮

For questions or support, please open an issue in the GitHub repository.
