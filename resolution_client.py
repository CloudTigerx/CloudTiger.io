import pygame
import sys
import os
import math
import random
import time

from blade_fighter_lessons import LessonManager

class GameClient:
    def __init__(self):
        pygame.init()
        
        # Initialize audio with better parameters for MP3 playback
        try:
            pygame.mixer.quit()  # Reset the mixer
            pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=4096)
            print("Audio system initialized with optimal parameters for MP3 playback")
        except Exception as e:
            print(f"Error initializing audio: {e}")
            # Try fallback initialization
            try:
                pygame.mixer.init()
                print("Audio system initialized with default parameters")
            except:
                print("Could not initialize audio system")
        
        # Sound setup
        self.sounds = {}
        try:
            # Create sounds directory if it doesn't exist
            os.makedirs('sounds', exist_ok=True)
            print("Sound system initialized. Place sound files in the 'sounds' directory.")
            
            # Load any existing sound files
            self.load_sounds()
        except Exception as e:
            print(f"Could not initialize sound system: {e}")
        
        # MP3 Player setup
        self.songs = []
        self.current_song_index = 0
        self.is_playing = False
        self.song_info = {"title": "", "artist": ""}
        self.load_songs()
        
        # Sound flags to prevent repeated sounds
        self.last_hover_sound_time = 0
        self.hover_sound_cooldown = 300  # Increased from 100ms to 300ms to further prevent sound spam
        self.hovered_buttons = set()  # Track which buttons are currently being hovered
        
        # Default resolution
        self.width = 1920
        self.height = 1080
        
        # Game version
        self.version = "1.0.0"
        
        # Menu particles for visual effects
        self.menu_particles = []
        self.last_particle_spawn = 0
        self.particle_spawn_delay = 200  # ms between particle spawns
        
        # Available resolutions
        self.resolutions = [
            (800, 600),
            (1024, 768),
            (1280, 720),
            (1920, 1080),
            (3840, 2160)  # 4K resolution
        ]
        
        # Create window with default resolution
        self.screen = pygame.display.set_mode((self.width, self.height))
        pygame.display.set_caption("Blade Fighters")
        
        # Load background images
        try:
            self.main_background = pygame.image.load("C:\\Users\\justi\\OneDrive\\Desktop\\Block_breaker\\puzzleassets\\colorful.png")
            print("Loaded colorful main menu background")
        except pygame.error:
            print("Could not load main background image. Using solid color instead.")
            self.main_background = None
            
        try:
            self.settings_background = pygame.image.load("C:\\Users\\justi\\OneDrive\\Desktop\\Block_breaker\\settingsbcg.jfif")
        except pygame.error:
            print("Could not load settings background image. Using solid color instead.")
            self.settings_background = None
            
        try:
            self.puzzle_background = pygame.image.load("C:\\Users\\justi\\OneDrive\\Desktop\\Block_breaker\\puzzleassets\\bkg.png")
            print("Loaded puzzle background image")
        except pygame.error as e:
            print(f"Could not load puzzle background image: {e}. Using solid color instead.")
            self.puzzle_background = None
        
        # Load puzzle pieces
        self.puzzle_pieces = {}
        self.block_size = 40  # Smaller block size to fit taller grid
        
        # Load regular blocks
        try:
            for color in ['red', 'blue', 'green', 'yellow']:
                image_path = f"C:\\Users\\justi\\OneDrive\\Desktop\\Block_breaker\\puzzleassets\\{color}block.png"
                if os.path.exists(image_path):
                    original_img = pygame.image.load(image_path)
                    # Scale down to appropriate size for game
                    scaled_img = pygame.transform.scale(original_img, (self.block_size, self.block_size))
                    self.puzzle_pieces[color] = scaled_img
                    print(f"Loaded {color} puzzle piece")
                else:
                    print(f"Warning: {image_path} not found")
                    
            # Load breaker blocks
            for color in ['red', 'blue', 'green', 'yellow']:
                breaker_path = f"C:\\Users\\justi\\OneDrive\\Desktop\\Block_breaker\\puzzleassets\\{color}breaker.png"
                
                if os.path.exists(breaker_path):
                    # Load the image file for all colors that have image files
                    original_img = pygame.image.load(breaker_path)
                    scaled_img = pygame.transform.scale(original_img, (self.block_size, self.block_size))
                    self.puzzle_pieces[f"{color}_breaker"] = scaled_img
                    print(f"Loaded {color} breaker piece from file")
                else:
                    # Fallback for missing files - use custom breaker blocks
                    self.puzzle_pieces[f"{color}_breaker"] = self.create_custom_breaker(color)
                    print(f"Created custom {color} breaker piece as fallback")
                
        except pygame.error as e:
            print(f"Error loading puzzle pieces: {e}")
            # Create fallback colored squares if images can't be loaded
            self.puzzle_pieces = {
                'red': self.create_colored_block((255, 0, 0)),
                'blue': self.create_colored_block((0, 0, 255)),
                'green': self.create_colored_block((0, 255, 0)),
                'yellow': self.create_colored_block((255, 255, 0)),
                'red_breaker': self.create_breaker_block((255, 0, 0)),
                'blue_breaker': self.create_breaker_block((0, 0, 255)),
                'green_breaker': self.create_breaker_block((0, 255, 0)),
                'yellow_breaker': self.create_breaker_block((255, 255, 0))
            }
        
        # Test puzzle grid (6x13 grid of random colors, include breakers)
        self.puzzle_grid = self.create_empty_grid(6, 13)
        
        # Grid dimensions
        self.grid_width = 6
        self.grid_height = 13
        
        # Game state variables
        self.game_active = False
        
        # Falling piece properties
        self.main_piece = None
        self.attached_piece = None
        self.piece_position = [0, 0]  # [x, y] in grid coordinates
        self.attached_position = 0  # 0: top, 1: right, 2: bottom, 3: left
        
        # Piece fall timing
        self.normal_fall_speed = 1200  # User adjusted value that works well
        self.accelerated_fall_speed = self.normal_fall_speed / 25  # 2200% faster
        self.current_fall_speed = self.normal_fall_speed
        self.last_fall_time = 0
        self.fall_distance = 0  # Fractional distance for smooth movement
        self.cell_fall_time = self.normal_fall_speed / self.grid_height  # Time to fall one cell
        
        # Movement interpolation for smoother FPS
        self.movement_interpolation = True  # Enable smooth movement
        self.visual_x = 0  # Visual x position for smooth rendering
        self.visual_y = 0  # Visual y position for smooth rendering
        self.movement_lerp_speed = 0.3  # Lower = smoother but slower, higher = faster but jerkier
        self.last_frame_time = 0  # For calculating delta time between frames
        
        # Tracking for wall kick limits to prevent floating up
        self.last_wall_kick_time = 0
        self.wall_kick_cooldown = 500  # ms cooldown for wall kicks
        self.wall_kick_count = 0
        self.max_wall_kicks = 2  # Maximum number of consecutive wall kicks allowed
        
        # Flip cooldown
        self.last_flip_time = 0
        self.flip_cooldown = 200  # ms cooldown between flip attempts
        
        # Piece generation
        self.next_main_piece = None
        self.next_attached_piece = None
        self.piece_types = ['red', 'blue', 'green', 'yellow', 
                           'red_breaker', 'blue_breaker', 'green_breaker', 'yellow_breaker']
        
        # Colors
        self.BLACK = (0, 0, 0)
        self.WHITE = (255, 255, 255)
        self.GRAY = (100, 100, 100)
        self.LIGHT_GRAY = (200, 200, 200)
        self.BLUE = (0, 100, 255)
        self.LIGHT_BLUE = (100, 150, 255)
        
        # Border glow colors - adjusted for purple/pink glow seen in the image
        self.GLOW_COLORS = [
            (210, 100, 240),  # Bright Purple
            (180, 60, 220),   # Medium Purple
            (150, 40, 200),   # Dark Purple
            (220, 120, 255)   # Pink-Purple
        ]
        self.glow_index = 0
        self.glow_direction = 1
        self.glow_intensity = 0.6  # Start with stronger glow
        self.glow_speed = 0.03     # Slower transition
        
        # Font
        self.font = pygame.font.SysFont(None, 36)
        
        # Current screen (main_menu, settings, game)
        self.current_screen = "main_menu"
        
        # Current lesson (for academy tracking)
        self.current_lesson = None
        
        # Button click cooldown to prevent multiple clicks
        self.last_click_time = 0
        self.click_cooldown = 300  # milliseconds
        
        # Key repeat settings for continuous movement when keys are held
        self.keys_pressed = {}
        self.key_repeat_delay = 120  # ms before the first repeat
        self.key_repeat_interval = 80  # ms between repeats after the first one
        self.last_key_action_time = {}
        
        # Animation and effect variables
        self.clusters = set()  # Tracks positions of blocks in clusters
        self.glow_time = 0  # For cluster glow animation
        self.breaking_blocks = []  # Tracks blocks currently being destroyed with animation
        self.breaking_animation_start = 0  # Time when breaking animation started
        self.breaking_animation_duration = 350  # Slightly increased for better particle effect
        self.chain_delay = 30  # Reduced from 60ms for better performance
        self.chain_reaction_in_progress = False  # Flag to track ongoing chain reactions
        self.last_cluster_check_time = 0  # Time of last cluster detection
        self.cluster_check_interval = 250  # Only check for clusters every 250ms
        
        # Simple particle system for break effects
        self.particles = []  # List of active particles
        # Set fixed colors to avoid any color format issues
        self.particle_colors = {
            'red': (255, 0, 0),
            'blue': (0, 0, 255),
            'green': (0, 255, 0),
            'yellow': (255, 255, 0),
            'white': (255, 255, 255)
        }
        self.sparkle_colors = [
            (255, 255, 255),  # White
            (255, 255, 200),  # Pale yellow
            (255, 240, 180),  # Pale gold
            (240, 240, 255)   # Pale blue
        ]
        
        # Initialize lesson manager
        self.lesson_manager = LessonManager(self)
    
    def create_colored_block(self, color):
        """Create a simple colored square as fallback for puzzle pieces."""
        surface = pygame.Surface((self.block_size, self.block_size))
        surface.fill(color)
        pygame.draw.rect(surface, self.BLACK, (0, 0, self.block_size, self.block_size), 2)
        return surface
    
    def create_breaker_block(self, color):
        """Create a simple breaker block as fallback."""
        surface = pygame.Surface((self.block_size, self.block_size))
        surface.fill(color)
        # Add an X to indicate it's a breaker
        pygame.draw.line(surface, self.WHITE, (5, 5), (self.block_size - 5, self.block_size - 5), 3)
        pygame.draw.line(surface, self.WHITE, (self.block_size - 5, 5), (5, self.block_size - 5), 3)
        pygame.draw.rect(surface, self.BLACK, (0, 0, self.block_size, self.block_size), 2)
        return surface
    
    def create_empty_grid(self, width, height):
        """Create an empty grid with None values."""
        return [[None for _ in range(width)] for _ in range(height)]
    
    def create_test_grid(self, width, height):
        """Create a test grid with random colors and breakers."""
        # All possible piece types (regular and breakers)
        all_pieces = list(self.puzzle_pieces.keys())
        
        # Regular colors and breaker colors (for better distribution)
        regular_colors = ['red', 'blue', 'green', 'yellow']
        breaker_colors = ['red_breaker', 'blue_breaker', 'green_breaker', 'yellow_breaker']
        
        grid = []
        for y in range(height):
            row = []
            for x in range(width):
                # 25% chance of spawning a breaker block
                if random.random() < 0.25:
                    # Choose a random breaker color
                    piece = random.choice(breaker_colors)
                else:
                    # Choose a random regular color
                    piece = random.choice(regular_colors)
                row.append(piece)
            grid.append(row)
        return grid
    
    def create_button(self, x, y, width, height, text, action=None, params=None):
        """Create a button with text at the given position."""
        button_rect = pygame.Rect(x, y, width, height)
        clicked = False
        
        # Create a unique identifier for this button based on position and text
        button_id = f"{x}_{y}_{text}"
        
        # Check if mouse is over the button
        mouse_pos = pygame.mouse.get_pos()
        hover = button_rect.collidepoint(mouse_pos)
        
        # Play hover sound only when mouse first enters the button
        current_time = pygame.time.get_ticks()
        if hover:
            # If this button wasn't hovered before, play sound
            if button_id not in self.hovered_buttons and 'hover' in self.sounds:
                if current_time - self.last_hover_sound_time > self.hover_sound_cooldown:
                    if self.sounds.get('hover'):
                        self.sounds['hover'].play()
                        self.last_hover_sound_time = current_time
            
            # Add this button to the set of currently hovered buttons
            self.hovered_buttons.add(button_id)
            
            # If clicked, play click sound
            if clicked and 'click' in self.sounds:
                if self.sounds.get('click'):
                    self.sounds['click'].play()
        else:
            # If this button was previously hovered, remove it
            if button_id in self.hovered_buttons:
                self.hovered_buttons.remove(button_id)
        
        # Base colors
        if hover:
            # Bright colors for hover state
            top_color = (80, 140, 240)      # Light blue-purple
            bottom_color = (100, 80, 220)   # Deep purple
            border_color = (210, 170, 255)  # Light lavender
            shadow_offset = 3
            
            # Check if button is clicked with cooldown
            if pygame.mouse.get_pressed()[0] and current_time - self.last_click_time > self.click_cooldown:
                self.last_click_time = current_time
                clicked = True
                
                # Play click sound
                if 'click' in self.sounds:
                    self.sounds['click'].play()
                
                if action:
                    if params:
                        action(*params)
                    else:
                        action()
                # Add "pressed" effect
                shadow_offset = 1
                top_color, bottom_color = bottom_color, top_color  # Invert gradient
        else:
            # Normal state colors
            top_color = (50, 90, 180)       # Dark blue
            bottom_color = (80, 50, 160)    # Dark purple
            border_color = (140, 120, 220)  # Medium purple
            shadow_offset = 4
        
        # Create gradient effect
        for i in range(height):
            # Calculate interpolated color for this line
            progress = i / height
            r = int(top_color[0] * (1 - progress) + bottom_color[0] * progress)
            g = int(top_color[1] * (1 - progress) + bottom_color[1] * progress)
            b = int(top_color[2] * (1 - progress) + bottom_color[2] * progress)
            line_color = (r, g, b)
            
            # Draw a line of the gradient
            pygame.draw.line(self.screen, line_color, (x, y + i), (x + width - 1, y + i))
        
        # Draw button shadow (before hover to create depth effect)
        shadow_rect = pygame.Rect(x + shadow_offset, y + shadow_offset, width, height)
        pygame.draw.rect(self.screen, (20, 20, 40), shadow_rect, 0, border_radius=5)
        
        # Draw button border with rounded corners
        pygame.draw.rect(self.screen, border_color, button_rect, 2, border_radius=5)
        
        # Add a subtle highlight at the top
        highlight_color = (
            min(255, border_color[0] + 20),
            min(255, border_color[1] + 20),
            min(255, border_color[2] + 20)
        )
        pygame.draw.line(self.screen, highlight_color, 
                         (x + 2, y + 2), (x + width - 3, y + 2), 2)
        
        # Draw the text with a subtle shadow
        text_font = pygame.font.SysFont(None, 36)  # Consistent font size
        
        # Text shadow
        text_shadow = text_font.render(text, True, (20, 20, 40))
        text_shadow_rect = text_shadow.get_rect(center=(button_rect.center[0] + 2, button_rect.center[1] + 2))
        self.screen.blit(text_shadow, text_shadow_rect)
        
        # Main text
        text_surf = text_font.render(text, True, self.WHITE)
        text_rect = text_surf.get_rect(center=button_rect.center)
        self.screen.blit(text_surf, text_rect)
        
        return clicked
    
    def change_resolution(self, width, height):
        """Change the window resolution."""
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((self.width, self.height))
    
    def set_screen(self, screen_name):
        """Change the current screen."""
        self.current_screen = screen_name
    
    def draw_main_menu(self):
        """Draw the main menu screen."""
        current_time = pygame.time.get_ticks()
        
        # Fill the screen with background
        if self.main_background:
            # Scale background to fit the screen
            scaled_bg = pygame.transform.scale(self.main_background, (self.width, self.height))
            self.screen.blit(scaled_bg, (0, 0))
        else:
            # Fallback to solid color if no background image
            self.screen.fill(self.WHITE)
        
        # Add a semi-transparent overlay to make text more readable
        overlay = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 160))  # Black with 60% transparency
        self.screen.blit(overlay, (0, 0))
        
        # Draw decorative frame around the screen edges
        frame_width = 10
        frame_colors = [
            (180, 100, 220),  # Purple
            (140, 70, 200),   # Dark purple
            (210, 130, 240)   # Light purple
        ]
        
        # Top and bottom borders with gradient
        for i in range(frame_width):
            progress = i / frame_width
            idx = int(progress * (len(frame_colors) - 1))
            color1 = frame_colors[idx]
            color2 = frame_colors[min(idx + 1, len(frame_colors) - 1)]
            
            blend_factor = progress * (len(frame_colors) - 1) - idx
            r = int(color1[0] * (1 - blend_factor) + color2[0] * blend_factor)
            g = int(color1[1] * (1 - blend_factor) + color2[1] * blend_factor)
            b = int(color1[2] * (1 - blend_factor) + color2[2] * blend_factor)
            
            color = (r, g, b)
            
            # Draw the frame lines
            pygame.draw.line(self.screen, color, (0, i), (self.width, i))
            pygame.draw.line(self.screen, color, (0, self.height - 1 - i), (self.width, self.height - 1 - i))
            pygame.draw.line(self.screen, color, (i, 0), (i, self.height))
            pygame.draw.line(self.screen, color, (self.width - 1 - i, 0), (self.width - 1 - i, self.height))
        
        # Update and draw particles
        self.update_menu_particles()
        self.draw_menu_particles()
        
        # Draw title with glow effect
        title_font = pygame.font.SysFont(None, 92)  # Larger font
        subtitle_font = pygame.font.SysFont(None, 36)
        
        # Title with glow effect
        title_text = "BLADE FIGHTERS"
        
        # Animate the glow intensity based on time
        glow_intensity = 0.7 + 0.3 * math.sin(current_time / 500)  # Oscillate between 0.7 and 1.0
        
        # Draw glow (multiple layers with decreasing alpha)
        glow_colors = [
            (210, 100, 240, int(120 * glow_intensity)),  # Purple glow
            (220, 120, 255, int(80 * glow_intensity)),   # Pink-purple glow
            (150, 150, 255, int(60 * glow_intensity))    # Blue glow
        ]
        
        for glow_color in glow_colors:
            for offset in range(1, 8, 2):  # Multiple layers of glow
                glow_title = title_font.render(title_text, True, glow_color)
                self.screen.blit(glow_title, (
                    self.width // 2 - glow_title.get_width() // 2 + offset, 
                    80 + offset
                ))
                self.screen.blit(glow_title, (
                    self.width // 2 - glow_title.get_width() // 2 - offset, 
                    80 - offset
                ))
        
        # Main title
        title = title_font.render(title_text, True, self.WHITE)
        title_x = self.width // 2 - title.get_width() // 2
        title_y = 80
        self.screen.blit(title, (title_x, title_y))
        
        # Draw decorative swords on either side of the title
        self.draw_sword(title_x - 80, title_y + 30, flip=True)
        self.draw_sword(title_x + title.get_width() + 40, title_y + 30, flip=False)
        
        # Add subtitle
        subtitle = subtitle_font.render("Master the Puzzle Combat", True, (220, 220, 255))
        self.screen.blit(subtitle, (self.width // 2 - subtitle.get_width() // 2, 170))
        
        # Draw menu buttons with improved styling
        button_width = 240  # Wider buttons
        button_height = 60  # Taller buttons
        button_spacing = 80
        
        # Play button
        self.create_button(
            self.width // 2 - button_width // 2,
            250,
            button_width,
            button_height,
            "Play",
            self.start_game
        )
        
        # Academy button
        self.create_button(
            self.width // 2 - button_width // 2,
            250 + button_spacing,
            button_width,
            button_height,
            "Academy",
            self.set_screen,
            ["academy_basics"]
        )
        
        # Settings button
        self.create_button(
            self.width // 2 - button_width // 2,
            250 + button_spacing * 2,
            button_width,
            button_height,
            "Settings",
            self.set_screen,
            ["settings"]
        )
        
        # Exit button
        exit_clicked = self.create_button(
            self.width // 2 - button_width // 2,
            250 + button_spacing * 3,
            button_width,
            button_height,
            "Exit",
            pygame.quit
        )
        
        # Draw version number and copyright
        version_font = pygame.font.SysFont(None, 20)
        version_text = version_font.render(f"Version {self.version}", True, (180, 180, 200))
        copyright_text = version_font.render("© 2023 Blade Fighters Studio", True, (180, 180, 200))
        
        self.screen.blit(version_text, (10, self.height - 40))
        self.screen.blit(copyright_text, (10, self.height - 20))
        
        # Draw the MP3 player
        self.draw_mp3_player()
        
        if exit_clicked:
            sys.exit()
    
    def draw_sword(self, x, y, flip=False):
        """Draw a decorative sword."""
        # Set up colors
        handle_color = (180, 140, 80)    # Brown
        guard_color = (220, 180, 50)     # Gold
        blade_color = (220, 220, 240)    # Silver
        
        # Define sword dimensions
        blade_length = 60
        blade_width = 8
        guard_width = 30
        guard_height = 10
        handle_length = 25
        handle_width = 6
        
        if flip:
            # Draw blade (flipped)
            pygame.draw.polygon(self.screen, blade_color, [
                (x + blade_length, y - blade_width // 2),
                (x + blade_length, y + blade_width // 2),
                (x, y + 2),
                (x, y - 2)
            ])
            
            # Draw guard (flipped)
            pygame.draw.rect(self.screen, guard_color, 
                            (x + blade_length - 5, y - guard_height // 2, guard_width, guard_height))
            
            # Draw handle (flipped)
            pygame.draw.rect(self.screen, handle_color, 
                            (x + blade_length + guard_width - 5, y - handle_width // 2, handle_length, handle_width))
        else:
            # Draw blade
            pygame.draw.polygon(self.screen, blade_color, [
                (x, y - blade_width // 2),
                (x, y + blade_width // 2),
                (x + blade_length, y + 2),
                (x + blade_length, y - 2)
            ])
            
            # Draw guard
            pygame.draw.rect(self.screen, guard_color, 
                            (x - guard_width + 5, y - guard_height // 2, guard_width, guard_height))
            
            # Draw handle
            pygame.draw.rect(self.screen, handle_color, 
                            (x - guard_width - handle_length + 5, y - handle_width // 2, handle_length, handle_width))
    
    def update_menu_particles(self):
        """Update menu particle positions and spawn new ones."""
        current_time = pygame.time.get_ticks()
        
        # Spawn new particles periodically
        if current_time - self.last_particle_spawn > self.particle_spawn_delay:
            self.last_particle_spawn = current_time
            
            # Add 1-3 new particles at random positions
            for _ in range(random.randint(1, 3)):
                particle = {
                    'x': random.randint(50, self.width - 50),
                    'y': random.randint(50, self.height - 50),
                    'size': random.randint(2, 6),
                    'color': random.choice([(220, 150, 250), (180, 180, 250), (250, 180, 220)]),
                    'speed_x': random.uniform(-0.5, 0.5),
                    'speed_y': random.uniform(-0.5, 0.5),
                    'life': 255,
                    'fade_speed': random.uniform(0.5, 1.5)
                }
                self.menu_particles.append(particle)
        
        # Update existing particles
        for particle in self.menu_particles[:]:
            # Move particle
            particle['x'] += particle['speed_x']
            particle['y'] += particle['speed_y']
            
            # Fade particle
            particle['life'] -= particle['fade_speed']
            
            # Remove faded particles
            if particle['life'] <= 0:
                self.menu_particles.remove(particle)
    
    def draw_menu_particles(self):
        """Draw menu particles."""
        for particle in self.menu_particles:
            alpha = max(0, min(255, int(particle['life'])))
            color_with_alpha = (*particle['color'], alpha)
            
            # Draw as a circle with transparency
            surf = pygame.Surface((particle['size'] * 2, particle['size'] * 2), pygame.SRCALPHA)
            pygame.draw.circle(surf, color_with_alpha, (particle['size'], particle['size']), particle['size'])
            self.screen.blit(surf, (particle['x'] - particle['size'], particle['y'] - particle['size']))
    
    def draw_settings_menu(self):
        """Draw the settings menu screen."""
        # Fill the screen with background
        if self.settings_background:
            # Scale background to fit the screen
            scaled_bg = pygame.transform.scale(self.settings_background, (self.width, self.height))
            self.screen.blit(scaled_bg, (0, 0))
        else:
            # Fallback to solid color if no background image
            self.screen.fill(self.WHITE)
        
        # Add a semi-transparent overlay to make text more readable
        overlay = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 128))  # Black with 50% transparency
        self.screen.blit(overlay, (0, 0))
        
        # Draw title
        title_font = pygame.font.SysFont(None, 54)
        title = title_font.render("Settings", True, self.WHITE)
        self.screen.blit(title, (self.width // 2 - title.get_width() // 2, 50))
        
        # Draw current resolution
        current_res = self.font.render(f"Current: {self.width}x{self.height}", True, self.WHITE)
        self.screen.blit(current_res, (self.width // 2 - current_res.get_width() // 2, 100))
        
        # Draw resolution buttons
        button_width = 200
        button_height = 50
        button_y_start = 150
        button_spacing = 60
        
        resolution_label = self.font.render("Resolution:", True, self.WHITE)
        self.screen.blit(resolution_label, (self.width // 2 - button_width // 2, button_y_start))
        
        for i, resolution in enumerate(self.resolutions):
            res_text = f"{resolution[0]}x{resolution[1]}"
            y_pos = button_y_start + 40 + i * button_spacing
            self.create_button(
                self.width // 2 - button_width // 2,
                y_pos,
                button_width,
                button_height,
                res_text,
                self.change_resolution,
                resolution
            )
        
        # Back button
        self.create_button(
            self.width // 2 - button_width // 2,
            button_y_start + 40 + len(self.resolutions) * button_spacing + 20,
            button_width,
            button_height,
            "Back",
            self.set_screen,
            ["main_menu"]
        )
        
        # Draw the MP3 player
        self.draw_mp3_player()
    
    def draw_academy_basics(self):
        """Draw the School of Blade Fighters lesson selection screen."""
        self.lesson_manager.draw_basic_lessons_menu()
        
        # Draw the MP3 player
        self.draw_mp3_player()
    
    def draw_lesson_basics_1(self):
        """Draw Lesson 1: Controls & Movement."""
        self.lesson_manager.draw_lesson_controls()
        
        # Draw the MP3 player
        self.draw_mp3_player()
    
    def draw_lesson_basics_2(self):
        """Draw Lesson 2: Forming Clusters."""
        self.lesson_manager.draw_lesson_clusters()
        
        # Draw the MP3 player
        self.draw_mp3_player()
    
    def start_lesson_practice(self, lesson_id):
        """Start a practice session for a specific lesson."""
        # Store the current lesson for reference
        self.current_lesson = lesson_id
        
        # Start the game
        self.start_game()
        
        # In a full implementation, we would track lesson completion
        # based on meeting specific goals during gameplay
        # For now, we'll just mark lessons as completed when practice starts
        self.lesson_manager.mark_lesson_completed(lesson_id)
    
    def start_game(self):
        """Start a new game."""
        self.current_screen = "game"
        self.game_active = True
        self.puzzle_grid = self.create_empty_grid(self.grid_width, self.grid_height)
        self.generate_new_piece()
        
    def draw_game_screen(self):
        """Draw the game screen with puzzle grid."""
        # Fill the entire screen with a dark color (not black) for menu areas
        dark_bg_color = (15, 15, 30)  # Darker background to match space theme
        self.screen.fill(dark_bg_color)
        
        # Update the clusters (detect blocks that form clusters), but not every frame
        current_time = pygame.time.get_ticks()
        if current_time - self.last_cluster_check_time > self.cluster_check_interval:
            self.clusters = self.detect_clusters()
            self.last_cluster_check_time = current_time
        
        # Calculate background image area - leave space around edges for menus
        side_margin = 100  # Space on left and right
        top_bottom_margin = 50  # Space on top and bottom
        
        bg_width = self.width - (side_margin * 2)
        bg_height = self.height - (top_bottom_margin * 2)
        bg_rect = pygame.Rect(side_margin, top_bottom_margin, bg_width, bg_height)
        
        # Draw the background image in the center area
        if self.puzzle_background:
            # Scale background to fit the smaller center area
            scaled_bg = pygame.transform.scale(self.puzzle_background, (bg_width, bg_height))
            self.screen.blit(scaled_bg, (side_margin, top_bottom_margin))
        else:
            # Fallback to slightly lighter color if no background image
            pygame.draw.rect(self.screen, (40, 40, 60), bg_rect)
        
        # Calculate grid position to center it within the background area
        grid_width = self.grid_width
        grid_height = self.grid_height
        
        # Calculate grid position to center it within the background area
        grid_total_width = grid_width * self.block_size
        grid_total_height = grid_height * self.block_size
        
        # Add padding to the grid area to prevent pieces from overlapping the border
        grid_padding = 10  # 10px padding on all sides
        grid_display_width = grid_total_width + (grid_padding * 2)
        grid_display_height = grid_total_height + (grid_padding * 2)
        
        # Ensure the grid fits within the background area with padding
        max_available_height = bg_height - 40
        
        # If the grid is too tall, rescale the block size
        if grid_display_height > max_available_height:
            new_block_size = int((max_available_height - (grid_padding * 2)) / grid_height)
            # If we need to rescale, recreate scaled images
            if new_block_size != self.block_size:
                self.block_size = new_block_size
                # Rescale all puzzle pieces
                for color in ['red', 'blue', 'green', 'yellow']:
                    # Regular blocks
                    image_path = f"C:\\Users\\justi\\OneDrive\\Desktop\\Block_breaker\\puzzleassets\\{color}block.png"
                    if os.path.exists(image_path):
                        original_img = pygame.image.load(image_path)
                        self.puzzle_pieces[color] = pygame.transform.scale(original_img, (self.block_size, self.block_size))
                    else:
                        self.puzzle_pieces[color] = self.create_colored_block((255, 0, 0) if color == 'red' else 
                                                                      (0, 0, 255) if color == 'blue' else
                                                                      (0, 255, 0) if color == 'green' else
                                                                      (255, 255, 0))
                    
                    # Breaker blocks
                    breaker_path = f"C:\\Users\\justi\\OneDrive\\Desktop\\Block_breaker\\puzzleassets\\{color}breaker.png"
                    if os.path.exists(breaker_path):
                        original_img = pygame.image.load(breaker_path)
                        scaled_img = pygame.transform.scale(original_img, (self.block_size, self.block_size))
                        self.puzzle_pieces[f"{color}_breaker"] = scaled_img
                    else:
                        # Use custom breaker block for missing files
                        self.puzzle_pieces[f"{color}_breaker"] = self.create_custom_breaker(color)
                
                # Recalculate dimensions
                grid_total_width = grid_width * self.block_size
                grid_total_height = grid_height * self.block_size
        
        # Center the grid in the background area (including padding)
        grid_x = side_margin + (bg_width - grid_display_width) // 2 + grid_padding
        grid_y = top_bottom_margin + (bg_height - grid_display_height) // 2 - 10 + grid_padding
        
        # Update glow animation values
        self.glow_intensity += self.glow_speed * self.glow_direction
        if self.glow_intensity >= 1:
            self.glow_intensity = 1
            self.glow_direction = -1
            # Change to next color when reaching peak intensity
            self.glow_index = (self.glow_index + 1) % len(self.GLOW_COLORS)
        elif self.glow_intensity <= 0.4:  # Keep a minimum glow
            self.glow_intensity = 0.4
            self.glow_direction = 1
            
        # Draw multiple glowing borders with different sizes for a nicer effect
        glow_color = self.GLOW_COLORS[self.glow_index]
        base_alpha = int(100 * self.glow_intensity)  # Base alpha that scales with intensity
        
        # Draw the grid outline with glow effect
        for offset in range(8, 1, -1):  # Increased range for stronger glow
            # Calculate alpha for this layer of the glow
            current_alpha = max(0, base_alpha - (offset * 10))  # Adjusted for stronger glow
            
            # Create a larger rect for the glow (including padding)
            glow_rect = pygame.Rect(
                grid_x - offset - grid_padding, 
                grid_y - offset - grid_padding, 
                grid_total_width + (offset * 2) + (grid_padding * 2), 
                grid_total_height + (offset * 2) + (grid_padding * 2)
            )
            
            # Create a surface with per-pixel alpha for the glow
            glow_surface = pygame.Surface(
                (glow_rect.width, glow_rect.height), 
                pygame.SRCALPHA
            )
            
            # Draw the glowing border with appropriate alpha
            color_with_alpha = (*glow_color, current_alpha)
            pygame.draw.rect(glow_surface, color_with_alpha, 
                          (0, 0, glow_rect.width, glow_rect.height), 
                          3)  # Thicker border
            
            # Blit the glow surface onto the screen
            self.screen.blit(glow_surface, (glow_rect.x, glow_rect.y))
        
        # Draw the actual grid border (with padding) - make it white for visibility
        grid_border_rect = pygame.Rect(
            grid_x - grid_padding, 
            grid_y - grid_padding, 
            grid_total_width + (grid_padding * 2), 
            grid_total_height + (grid_padding * 2)
        )
        pygame.draw.rect(self.screen, (255, 255, 255), grid_border_rect, 2)
        
        # Optional semi-transparent overlay inside the grid for better contrast with pieces
        grid_interior = pygame.Rect(
            grid_x - grid_padding + 2, 
            grid_y - grid_padding + 2, 
            grid_total_width + (grid_padding * 2) - 4, 
            grid_total_height + (grid_padding * 2) - 4
        )
        overlay = pygame.Surface((grid_interior.width, grid_interior.height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 40))  # Very light dark overlay
        self.screen.blit(overlay, (grid_interior.x, grid_interior.y))
        
        # Draw the grid cells without grid lines
        for y in range(self.grid_height):
            for x in range(self.grid_width):
                # Draw the piece if present
                piece_type = self.puzzle_grid[y][x]
                if piece_type:
                    piece_x = grid_x + (x * self.block_size)
                    piece_y = grid_y + (y * self.block_size)
                    
                    # Draw normal block
                    self.screen.blit(self.puzzle_pieces[piece_type], (piece_x, piece_y))
                    
                    # If this block is part of a cluster, make it glow
                    if (x, y) in self.clusters:
                        # Create a pulsing glow effect
                        current_time = pygame.time.get_ticks()
                        glow_factor = 0.5 + 0.5 * math.sin(current_time / 200)  # Pulsing effect
                        
                        # Create a glowing surface
                        glow_surface = pygame.Surface((self.block_size, self.block_size), pygame.SRCALPHA)
                        
                        # Get base color without suffix (red, blue, green, yellow)
                        base_color = piece_type.split('_')[0]
                        
                        # Determine glow color based on block color
                        if base_color == 'red':
                            glow_color = (255, 100, 100, int(150 * glow_factor))
                        elif base_color == 'blue':
                            glow_color = (100, 100, 255, int(150 * glow_factor))
                        elif base_color == 'green':
                            glow_color = (100, 255, 100, int(150 * glow_factor))
                        elif base_color == 'yellow':
                            glow_color = (255, 255, 100, int(150 * glow_factor))
                        else:
                            glow_color = (255, 255, 255, int(150 * glow_factor))
                        
                        # Fill the glow surface with the color
                        glow_surface.fill(glow_color)
                        
                        # Blit the glow on top of the normal block
                        self.screen.blit(glow_surface, (piece_x, piece_y))
        
        # Draw the falling piece if the game is active
        if self.game_active and self.main_piece:
            # Get actual grid positions
            main_x, main_y = self.piece_position
            attached_x, attached_y = self.get_attached_position_coords()
            
            # Use visual positions if interpolation is enabled, otherwise use grid positions
            if self.movement_interpolation:
                # Calculate fractional positions for smoother movement
                screen_x = grid_x + (self.visual_x * self.block_size)
                screen_y = grid_y + (self.visual_y * self.block_size)
                
                # Draw main piece at interpolated position
                if main_y >= -1:  # Only draw if at least partially visible
                    self.screen.blit(self.puzzle_pieces[self.main_piece], (screen_x, screen_y))
                
                # Calculate attached piece position based on interpolated main position
                if self.attached_position == 0:  # Top
                    attached_screen_x = screen_x
                    attached_screen_y = screen_y - self.block_size
                elif self.attached_position == 1:  # Right
                    attached_screen_x = screen_x + self.block_size
                    attached_screen_y = screen_y
                elif self.attached_position == 2:  # Bottom
                    attached_screen_x = screen_x
                    attached_screen_y = screen_y + self.block_size
                elif self.attached_position == 3:  # Left
                    attached_screen_x = screen_x - self.block_size
                    attached_screen_y = screen_y
                
                # Define fractional_offset for attached piece rendering
                fractional_offset = 0
                if self.would_fit_below():
                    fractional_offset = min(math.floor(self.fall_distance * self.block_size), self.block_size - 1)
                
                # Draw attached piece at interpolated position
                if attached_y >= -1:  # Only draw if at least partially visible
                    self.screen.blit(self.puzzle_pieces[self.attached_piece], (attached_screen_x, attached_screen_y))
            else:
                # Original non-interpolated drawing code
                # Draw main piece - always draw at exact grid positions to avoid visual overlapping
                fractional_offset = 0
                if self.would_fit_below():
                    fractional_offset = min(math.floor(self.fall_distance * self.block_size), self.block_size - 1)
                    
                    # Prevent overlapping even when falling smoothly
                    # Check if we're close to a piece below that would cause overlap
                    if main_y + 1 < self.grid_height and main_y + 1 >= 0 and self.puzzle_grid[main_y + 1][main_x] is not None:
                        # If we're getting too close, limit the fractional offset
                        max_safe_offset = self.block_size // 2
                        fractional_offset = min(fractional_offset, max_safe_offset)
                
                if main_y >= -1:  # Only draw if it's at least partially visible
                    screen_x = grid_x + (main_x * self.block_size)
                    screen_y = grid_y + (main_y * self.block_size) + fractional_offset
                    
                    self.screen.blit(self.puzzle_pieces[self.main_piece], (screen_x, screen_y))
                
                # Draw attached piece - with the same exact grid alignment
                if attached_y >= -1:  # Only draw if it's at least partially visible
                    screen_x = grid_x + (attached_x * self.block_size)
                    screen_y = grid_y + (attached_y * self.block_size) + fractional_offset
                    
                    self.screen.blit(self.puzzle_pieces[self.attached_piece], (screen_x, screen_y))
        
        # Draw next piece preview window
        if self.next_main_piece and self.next_attached_piece:
            # Create a preview window in the top-left corner
            preview_margin = 20
            preview_size = self.block_size * 4  # Make it big enough for the two blocks with padding
            preview_x = side_margin + preview_margin
            preview_y = top_bottom_margin + preview_margin
            
            # Draw the preview box with a title
            preview_title = self.font.render("Next", True, self.WHITE)
            preview_title_rect = preview_title.get_rect(center=(preview_x + preview_size // 2, preview_y - 15))
            self.screen.blit(preview_title, preview_title_rect)
            
            # Draw the preview box background
            preview_rect = pygame.Rect(preview_x, preview_y, preview_size, preview_size)
            pygame.draw.rect(self.screen, (40, 40, 60), preview_rect)
            pygame.draw.rect(self.screen, (100, 100, 150), preview_rect, 2)  # Border
            
            # Add a semi-transparent overlay for better contrast
            preview_overlay = pygame.Surface((preview_size, preview_size), pygame.SRCALPHA)
            preview_overlay.fill((0, 0, 0, 40))
            self.screen.blit(preview_overlay, (preview_x, preview_y))
            
            # Calculate positions for the preview pieces
            # Center the main piece and place the attached piece based on the attachment position
            main_preview_x = preview_x + (preview_size - self.block_size) // 2
            main_preview_y = preview_y + (preview_size - self.block_size) // 2
            
            # Draw the main piece
            self.screen.blit(self.puzzle_pieces[self.next_main_piece], (main_preview_x, main_preview_y))
            
            # Draw the attached piece based on the default attachment position (0: top)
            attached_preview_x = main_preview_x
            attached_preview_y = main_preview_y - self.block_size  # Positioned above main piece
            self.screen.blit(self.puzzle_pieces[self.next_attached_piece], (attached_preview_x, attached_preview_y))
        
        # Draw the MP3 player on top of the game screen
        self.draw_mp3_player()
    
    def would_fit_below(self):
        """Check if the piece would fit in the position below its current position."""
        # Get positions
        main_x, main_y = self.piece_position
        attached_x, attached_y = self.get_attached_position_coords()
        
        # Check if both pieces can move down by one grid cell
        return (self.is_valid_position(main_x, main_y + 1) and 
                self.is_valid_position(attached_x, attached_y + 1))
    
    def update_falling_piece(self):
        """Update the position of the falling piece based on time."""
        if not self.main_piece:
            self.generate_new_piece()
            # Initialize visual positions for smooth movement
            self.visual_x = self.piece_position[0]
            self.visual_y = self.piece_position[1]
            return
        
        # If there's an ongoing chain reaction, process that first before moving pieces
        if self.chain_reaction_in_progress:
            self.activate_breaker_blocks()
            return
        
        current_time = pygame.time.get_ticks()
        elapsed = current_time - self.last_fall_time
        
        # Update visual position with interpolation for smoother movement
        if self.movement_interpolation:
            # Calculate delta time for smooth interpolation (capped to avoid jumps after lag)
            delta_time = min(0.1, (current_time - self.last_frame_time) / 1000.0)
            
            # Smoothly interpolate visual position toward actual position
            self.visual_x += (self.piece_position[0] - self.visual_x) * self.movement_lerp_speed * (60 * delta_time)
            # For Y position, also factor in the fall distance for extra smoothness
            target_y = self.piece_position[1] + self.fall_distance
            self.visual_y += (target_y - self.visual_y) * self.movement_lerp_speed * (60 * delta_time)
            
            # Update last frame time for next calculation
            self.last_frame_time = current_time
        
        # Check if it's time to update the fall position
        if elapsed > self.cell_fall_time:
            # Update the fractional fall distance more frequently for smoother movement
            fraction_to_add = (self.cell_fall_time / self.current_fall_speed) * (elapsed / self.cell_fall_time)
            self.fall_distance += fraction_to_add
            
            # If fall_distance reaches or exceeds 1, move the piece down by that many cells
            if self.fall_distance >= 1.0:
                whole_cells = int(self.fall_distance)
                self.fall_distance -= whole_cells
                
                # Try to move down by calculated cells
                moved = False
                for _ in range(whole_cells):
                    # Check if we can move down one more cell
                    if self.would_fit_below():
                        self.piece_position[1] += 1
                        moved = True
                    else:
                        # Can't move down, place the piece
                        self.fall_distance = 0  # Reset to avoid visual jerk
                        self.place_piece_on_grid()
                        break
                
                # If we moved, update the last fall time
                if moved:
                    self.last_fall_time = current_time
            else:
                # Just update the timer if we didn't need to move yet
                self.last_fall_time = current_time
        
        # Handle key repeat for movement keys - more responsive with shorter intervals
        for key in self.keys_pressed:
            # Calculate time since last action for this key
            time_since_last_action = current_time - self.last_key_action_time.get(key, 0)
            
            # Check initial delay for first repeat
            initial_delay_passed = time_since_last_action >= self.key_repeat_delay
            
            # For subsequent repeats, check if interval time has passed
            repeat_ready = (initial_delay_passed and 
                            (time_since_last_action - self.key_repeat_delay) % self.key_repeat_interval <= 16)  # 16ms ≈ 1 frame at 60fps
            
            # Process repeated key actions
            if repeat_ready:
                # Update the last action time for this key
                self.last_key_action_time[key] = current_time - (
                    self.key_repeat_delay + 
                    ((time_since_last_action - self.key_repeat_delay) // self.key_repeat_interval) * self.key_repeat_interval
                )
                
                # Process movement keys
                if key == pygame.K_LEFT:
                    self.move_piece(-1, 0)
                elif key == pygame.K_RIGHT:
                    self.move_piece(1, 0)
    
    def place_piece_on_grid(self):
        """Place the falling piece onto the grid."""
        # Get positions
        main_x, main_y = self.piece_position
        attached_x, attached_y = self.get_attached_position_coords()
        
        # Place main piece if it's within grid
        if 0 <= main_y < self.grid_height and 0 <= main_x < self.grid_width:
            self.puzzle_grid[main_y][main_x] = self.main_piece
        
        # Place attached piece if it's within grid
        if 0 <= attached_y < self.grid_height and 0 <= attached_x < self.grid_width:
            self.puzzle_grid[attached_y][attached_x] = self.attached_piece
        
        # Apply gravity to make pieces fall into empty spaces
        self.apply_gravity()
        
        # Start a chain reaction by activating any breaker blocks
        self.chain_reaction_in_progress = True
        self.activate_breaker_blocks()
        
        # Clear the current piece (but don't generate a new one yet - will happen in update_falling_piece)
        self.main_piece = None
        self.attached_piece = None
    
    def activate_breaker_blocks(self):
        """Activate breaker blocks to destroy connected groups of the same color with animations."""
        current_time = pygame.time.get_ticks()
        
        # If there's a breaking animation in progress, wait for it to finish
        if self.breaking_blocks and current_time - self.breaking_animation_start < self.breaking_animation_duration:
            return
        
        # If breaking blocks are present but animation is done, remove them and apply gravity
        if self.breaking_blocks:
            # Clear all the breaking blocks from the grid
            for x, y, _, _, _, _ in self.breaking_blocks:
                if 0 <= y < self.grid_height and 0 <= x < self.grid_width:
                    # Remove the block from the grid
                    self.puzzle_grid[y][x] = None
                    
                    # Create particles for the block
                    self.create_block_particles(x, y)
            
            # Clear the breaking blocks list
            self.breaking_blocks = []
            
            # Apply gravity after removing blocks
            self.apply_gravity()
            
            # Check for additional breakers that may have been activated by gravity
            return
        
        # Track if any activation occurred this cycle
        activation_occurred = False
        
        # Collect all breakers to activate in this cycle
        breakers_to_activate = []
        
        # Scan the entire grid for breaker blocks
        for y in range(self.grid_height):
            for x in range(self.grid_width):
                # Check if current position contains a breaker block
                if self.puzzle_grid[y][x] is not None and "_breaker" in self.puzzle_grid[y][x]:
                    breaker_color = self.puzzle_grid[y][x].split('_')[0]
                    
                    # Check adjacent positions (up, right, down, left)
                    adjacent_positions = [
                        (x, y - 1),  # up
                        (x + 1, y),  # right
                        (x, y + 1),  # down
                        (x - 1, y)   # left
                    ]
                    
                    # Check if any adjacent position has matching color
                    breaker_activated = False
                    for adj_x, adj_y in adjacent_positions:
                        if (0 <= adj_x < self.grid_width and 0 <= adj_y < self.grid_height and
                                self.puzzle_grid[adj_y][adj_x] is not None):
                            # Get the color without any suffix
                            adjacent_color = self.puzzle_grid[adj_y][adj_x].split('_')[0]
                            
                            # If this is a matching color, the breaker is activated
                            if adjacent_color == breaker_color:
                                breaker_activated = True
                                break
                    
                    if breaker_activated:
                        # Add this breaker to the list to activate
                        breakers_to_activate.append((x, y, breaker_color, adjacent_positions))
        
        # Process all breakers that need activation
        if breakers_to_activate:
            activation_occurred = True
            self.breaking_animation_start = current_time
            
            # Process all breakers at once
            for x, y, breaker_color, adjacent_positions in breakers_to_activate:
                # Identify all pieces to be destroyed
                to_clear = set()
                
                # First, find all clusters of the same color
                clusters = self.detect_clusters()
                cluster_blocks = set()
                
                # Find all color-matching blocks in clusters
                for cluster_x, cluster_y in clusters:
                    if (self.puzzle_grid[cluster_y][cluster_x] is not None and
                            self.puzzle_grid[cluster_y][cluster_x].split('_')[0] == breaker_color):
                        cluster_blocks.add((cluster_x, cluster_y))
                
                # Add the breaker itself (will explode immediately)
                to_clear.add((x, y))
                
                # Second, find all connected pieces of the same color (for chain-breaking)
                chain_blocks = set()
                for adj_x, adj_y in adjacent_positions:
                    if (0 <= adj_x < self.grid_width and 0 <= adj_y < self.grid_height and
                            self.puzzle_grid[adj_y][adj_x] is not None):
                        # Get the color without any suffix
                        adjacent_color = self.puzzle_grid[adj_y][adj_x].split('_')[0]
                        
                        # If this is a matching color, find all connected pieces
                        if adjacent_color == breaker_color:
                            connected = self.find_connected_pieces(adj_x, adj_y, breaker_color)
                            # Add connected pieces that aren't in clusters
                            for conn_x, conn_y in connected:
                                if (conn_x, conn_y) not in cluster_blocks:
                                    chain_blocks.add((conn_x, conn_y))
                
                # First add the breaker itself and cluster blocks (explode immediately)
                explosion_blocks = list(to_clear) + list(cluster_blocks)
                for ex, ey in explosion_blocks:
                    if 0 <= ey < self.grid_height and 0 <= ex < self.grid_width and self.puzzle_grid[ey][ex] is not None:
                        # Get block color for particles
                        block_color = self.puzzle_grid[ey][ex]
                        is_breaker = "_breaker" in block_color
                        # Add to breaking blocks list with delay=0 (immediate)
                        self.breaking_blocks.append((ex, ey, current_time, 0, block_color, is_breaker))
                
                # Then add chain blocks with increasing delays
                chain_blocks_list = list(chain_blocks)
                
                # Sort chain blocks by distance from breaker for more natural breaking
                chain_blocks_list.sort(key=lambda pos: math.sqrt((pos[0] - x)**2 + (pos[1] - y)**2))
                
                for i, (cx, cy) in enumerate(chain_blocks_list):
                    if 0 <= cy < self.grid_height and 0 <= cx < self.grid_width and self.puzzle_grid[cy][cx] is not None:
                        # Get block color for particles
                        block_color = self.puzzle_grid[cy][cx]
                        is_breaker = "_breaker" in block_color
                        # Calculate delay based on distance from breaker
                        delay = int(self.chain_delay * (i / max(1, len(chain_blocks_list) - 1)))
                        self.breaking_blocks.append((cx, cy, current_time, delay, block_color, is_breaker))
                
            # No early return here, we process all breakers
        
        # If no activation occurred and there are no blocks being animated, we're done
        if not activation_occurred and not self.breaking_blocks:
            # We're done with this chain reaction
            self.chain_reaction_in_progress = False
            # Check for clusters once more after all breakers are done
            self.clusters = self.detect_clusters()
    
    def detect_clusters(self):
        """
        Detect clusters of blocks that are 2+ blocks wide and 2+ blocks high.
        Returns a set of (x, y) coordinates of blocks in clusters.
        """
        # Performance optimization - use a more efficient algorithm
        clusters = set()
        visited = set()
        
        # Go through each cell in the grid
        for y in range(self.grid_height):
            for x in range(self.grid_width):
                # Skip if already visited or if empty
                if (x, y) in visited or self.puzzle_grid[y][x] is None:
                    continue
                
                # Get the color of the current block
                current_color = self.puzzle_grid[y][x].split('_')[0]
                
                # Check for minimum 2x2 cluster at this position
                if (x + 1 < self.grid_width and y + 1 < self.grid_height and
                    self.puzzle_grid[y][x+1] is not None and
                    self.puzzle_grid[y+1][x] is not None and
                    self.puzzle_grid[y+1][x+1] is not None):
                    
                    # Check if all are the same color
                    if (self.puzzle_grid[y][x+1].split('_')[0] == current_color and
                        self.puzzle_grid[y+1][x].split('_')[0] == current_color and
                        self.puzzle_grid[y+1][x+1].split('_')[0] == current_color):
                        
                        # We've found a 2x2 cluster of the same color
                        clusters.add((x, y))
                        clusters.add((x+1, y))
                        clusters.add((x, y+1))
                        clusters.add((x+1, y+1))
                        
                        # Mark all as visited
                        visited.add((x, y))
                        visited.add((x+1, y))
                        visited.add((x, y+1))
                        visited.add((x+1, y+1))
                        
                        # Try to extend the cluster if possible (but limit to avoid excessive computation)
                        self._extend_cluster(clusters, visited, x, y, current_color, 5, 5)
        
        return clusters
    
    def _extend_cluster(self, clusters, visited, start_x, start_y, color, max_width, max_height):
        """Helper method to extend clusters efficiently with size limits"""
        # Find how far right and down we can extend
        width = 2  # Already verified 2x2
        height = 2
        
        # Try to extend right
        for x in range(start_x + 2, min(start_x + max_width, self.grid_width)):
            # Check if entire column has same color
            valid_column = True
            for y in range(start_y, start_y + height):
                if (y >= self.grid_height or 
                    self.puzzle_grid[y][x] is None or
                    self.puzzle_grid[y][x].split('_')[0] != color):
                    valid_column = False
                    break
            
            if valid_column:
                # Add this column to the cluster
                width += 1
                for y in range(start_y, start_y + height):
                    clusters.add((x, y))
                    visited.add((x, y))
            else:
                break
        
        # Try to extend down
        for y in range(start_y + 2, min(start_y + max_height, self.grid_height)):
            # Check if entire row has same color
            valid_row = True
            for x in range(start_x, start_x + width):
                if (x >= self.grid_width or 
                    self.puzzle_grid[y][x] is None or 
                    self.puzzle_grid[y][x].split('_')[0] != color):
                    valid_row = False
                    break
            
            if valid_row:
                # Add this row to the cluster
                height += 1
                for x in range(start_x, start_x + width):
                    clusters.add((x, y))
                    visited.add((x, y))
            else:
                break
    
    def find_connected_pieces(self, start_x, start_y, target_color):
        """
        Use flood fill to find all connected pieces of the same color.
        Returns a set of (x, y) coordinates.
        """
        if not (0 <= start_x < self.grid_width and 0 <= start_y < self.grid_height):
            return set()
            
        if self.puzzle_grid[start_y][start_x] is None:
            return set()
            
        # Get color of the starting piece without any suffix
        piece_color = self.puzzle_grid[start_y][start_x].split('_')[0]
        if piece_color != target_color:
            return set()
        
        # Initialize the search
        connected = set()
        queue = [(start_x, start_y)]
        visited = set(queue)
        
        # Breadth-first search to find all connected pieces
        while queue:
            x, y = queue.pop(0)
            connected.add((x, y))
            
            # Check all four adjacent positions
            for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]:  # Up, right, down, left
                nx, ny = x + dx, y + dy
                
                # Check if the new position is valid and has the same color
                if ((nx, ny) not in visited and 
                    0 <= nx < self.grid_width and 
                    0 <= ny < self.grid_height and 
                    self.puzzle_grid[ny][nx] is not None):
                    
                    # Check if the color matches (ignoring suffixes like "_breaker")
                    next_color = self.puzzle_grid[ny][nx].split('_')[0]
                    if next_color == target_color:
                        queue.append((nx, ny))
                        visited.add((nx, ny))
        
        return connected
    
    def apply_gravity(self):
        """Apply gravity to make pieces fall down to fill empty spaces."""
        # We need multiple passes to handle cascading falls
        gravity_applied = True
        while gravity_applied:
            gravity_applied = False
            
            # Scan from bottom up (skip the bottom row as nothing can fall below it)
            for y in range(self.grid_height - 2, -1, -1):
                for x in range(self.grid_width):
                    # If there's a piece here and empty space below it
                    if self.puzzle_grid[y][x] is not None and self.puzzle_grid[y + 1][x] is None:
                        # Move the piece down
                        self.puzzle_grid[y + 1][x] = self.puzzle_grid[y][x]
                        self.puzzle_grid[y][x] = None
                        gravity_applied = True  # Continue checking for cascading effects
    
    def generate_new_piece(self):
        """Generate a new main and attached piece."""
        # Use the pre-generated pieces if available
        if self.next_main_piece and self.next_attached_piece:
            self.main_piece = self.next_main_piece
            self.attached_piece = self.next_attached_piece
        else:
            # Generate random pieces
            self.main_piece = self.generate_random_piece()
            self.attached_piece = self.generate_random_piece()
        
        # Generate the next pieces
        self.next_main_piece = self.generate_random_piece()
        self.next_attached_piece = self.generate_random_piece()
        
        # Set starting position (middle column, above the grid)
        self.piece_position = [self.grid_width // 2, -2]  # Start above the visible grid
        self.attached_position = 0  # Start with attached piece on top
        
        # Reset fall timing
        self.fall_distance = 0
        self.last_fall_time = pygame.time.get_ticks()
        
        # Reset to normal fall speed - this forces player to press spacebar again for new piece
        self.current_fall_speed = self.normal_fall_speed
        
        # Clear spacebar from pressed keys to require a new press
        if pygame.K_SPACE in self.keys_pressed:
            del self.keys_pressed[pygame.K_SPACE]
        if pygame.K_SPACE in self.last_key_action_time:
            del self.last_key_action_time[pygame.K_SPACE]
    
    def generate_random_piece(self):
        """Generate a random piece, with 25% chance of being a breaker."""
        if random.random() < 0.25:
            # Generate a breaker piece
            color = random.choice(['red', 'blue', 'green', 'yellow'])
            return f"{color}_breaker"
        else:
            # Generate a regular piece
            return random.choice(['red', 'blue', 'green', 'yellow'])
            
    def get_attached_position_coords(self):
        """Get the grid coordinates of the attached piece based on its position."""
        x, y = self.piece_position
        
        if self.attached_position == 0:  # Top
            return [x, y - 1]
        elif self.attached_position == 1:  # Right
            return [x + 1, y]
        elif self.attached_position == 2:  # Bottom
            return [x, y + 1]
        elif self.attached_position == 3:  # Left
            return [x - 1, y]
    
    def is_valid_position(self, x, y):
        """Check if a position is valid (within grid and not occupied)."""
        # Out of bounds check
        if x < 0 or x >= self.grid_width or y >= self.grid_height:
            print(f"DEBUG: Position ({x}, {y}) is out of bounds")
            return False
        
        # If above the grid, it's valid
        if y < 0:
            print(f"DEBUG: Position ({x}, {y}) is above grid (valid)")
            return True
        
        # Check if the space is already occupied
        is_empty = self.puzzle_grid[y][x] is None
        if not is_empty:
            print(f"DEBUG: Position ({x}, {y}) is occupied by {self.puzzle_grid[y][x]}")
        else:
            print(f"DEBUG: Position ({x}, {y}) is empty (valid)")
        return is_empty
    
    def move_piece(self, dx, dy):
        """Attempt to move the piece by the given delta."""
        # Calculate new position
        new_x = self.piece_position[0] + dx
        new_y = self.piece_position[1] + dy
        
        # Get attached piece coordinates for new position
        attached_x = new_x
        attached_y = new_y
        
        if self.attached_position == 0:  # Top
            attached_y -= 1
        elif self.attached_position == 1:  # Right
            attached_x += 1
        elif self.attached_position == 2:  # Bottom
            attached_y += 1
        elif self.attached_position == 3:  # Left
            attached_x -= 1
        
        # Check if the new position is valid for both pieces
        if self.is_valid_position(new_x, new_y) and self.is_valid_position(attached_x, attached_y):
            self.piece_position = [new_x, new_y]
            return True
        
        return False
        
    def rotate_attached_piece(self, direction):
        """
        Rotate the attached piece around the main piece.
        Allows for omni movement on outside columns.
        """
        # Calculate new position (0: top, 1: right, 2: bottom, 3: left)
        new_position = (self.attached_position + direction) % 4
        
        # Get current piece coordinates
        main_x, main_y = self.piece_position
        
        # For edge cases (outside columns)
        is_left_edge = (main_x == 0)
        is_right_edge = (main_x == self.grid_width - 1)
        
        # Standard position checks with omni movement support
        valid_position = False
        
        if new_position == 0:  # Top
            valid_position = self.is_valid_position(main_x, main_y - 1)
        elif new_position == 1:  # Right
            # If at right edge, don't check right (will be handled by omni logic)
            if not is_right_edge:
                valid_position = self.is_valid_position(main_x + 1, main_y)
        elif new_position == 2:  # Bottom
            valid_position = self.is_valid_position(main_x, main_y + 1)
        elif new_position == 3:  # Left
            # If at left edge, don't check left (will be handled by omni logic)
            if not is_left_edge:
                valid_position = self.is_valid_position(main_x - 1, main_y)
        
        # Apply the rotation if valid
        if valid_position:
            self.attached_position = new_position
            # Reset wall kick count when normal rotation occurs
            self.wall_kick_count = 0
            return True
        
        # Check if we're exceeded wall kick limits
        current_time = pygame.time.get_ticks()
        if self.wall_kick_count >= self.max_wall_kicks and current_time - self.last_wall_kick_time < self.wall_kick_cooldown:
            return False
            
        # Handle omni movement for edges
        if is_right_edge and new_position == 1:  # Right edge trying to rotate right
            # Check if we can move the main piece left to make room, and the piece is not at the top of the screen
            if self.is_valid_position(main_x - 1, main_y) and main_y > 0:
                # If the move would push the piece above the grid, prevent it
                attached_y = main_y
                if new_position == 0:  # If rotating to top
                    attached_y -= 1
                
                if attached_y < 0:
                    return False
                    
                # Move main piece left
                self.piece_position[0] -= 1
                # Set attached to right
                self.attached_position = 1
                
                # Update wall kick tracking
                self.wall_kick_count += 1
                self.last_wall_kick_time = current_time
                
                return True
        elif is_left_edge and new_position == 3:  # Left edge trying to rotate left
            # Check if we can move the main piece right to make room, and the piece is not at the top of the screen
            if self.is_valid_position(main_x + 1, main_y) and main_y > 0:
                # If the move would push the piece above the grid, prevent it
                attached_y = main_y
                if new_position == 0:  # If rotating to top
                    attached_y -= 1
                
                if attached_y < 0:
                    return False
                    
                # Move main piece right
                self.piece_position[0] += 1
                # Set attached to left
                self.attached_position = 3
                
                # Update wall kick tracking
                self.wall_kick_count += 1
                self.last_wall_kick_time = current_time
                
                return True
        
        return False

    def flip_pieces_vertically(self):
        """
        Flip the main and attached pieces vertically if they're in a valid position
        for flipping (between towers or at board edge).
        Returns True if the flip was successful, False otherwise.
        """
        print("DEBUG: Attempting to flip pieces vertically")
        
        # Check if on cooldown
        current_time = pygame.time.get_ticks()
        if current_time - self.last_flip_time < self.flip_cooldown:
            print(f"DEBUG: Flip on cooldown ({current_time - self.last_flip_time}/{self.flip_cooldown}ms)")
            return False
            
        # Get current positions
        main_x, main_y = self.piece_position
        attached_x, attached_y = self.get_attached_position_coords()
        
        print(f"DEBUG: Checking flip for main({main_x}, {main_y}), attached({attached_x}, {attached_y}), orientation: {self.attached_position}")
        
        # Check if the pieces are in a valid position for flipping
        if not self.can_flip_vertically():
            print("DEBUG: can_flip_vertically() returned False")
            return False
            
        # Track if the flip was successful
        flip_successful = False
            
        # Determine the new positions after flipping
        if self.attached_position == 0:  # Attached is above
            # Flip to attached below
            self.attached_position = 2
            flip_successful = True
            print("DEBUG: Flipped from attached above to attached below")
        elif self.attached_position == 2:  # Attached is below
            # Flip to attached above
            self.attached_position = 0
            flip_successful = True
            print("DEBUG: Flipped from attached below to attached above")
        elif self.attached_position == 1 or self.attached_position == 3:  # Attached is horizontal
            # Try both up-down and down-up flipping
            
            # First try moving main up and attached down
            if self.is_valid_position(main_x, main_y - 1) and self.is_valid_position(attached_x, attached_y + 1):
                self.piece_position[1] -= 1  # Move main piece up
                self.attached_position = 2   # Set attached to below
                flip_successful = True
                print(f"DEBUG: Flipped horizontally arranged pieces upward (main moved from y={main_y} to y={main_y-1})")
            # Otherwise try moving main down and attached up
            elif self.is_valid_position(main_x, main_y + 1) and self.is_valid_position(attached_x, attached_y - 1):
                self.piece_position[1] += 1  # Move main piece down
                self.attached_position = 0   # Set attached to above
                flip_successful = True
                print(f"DEBUG: Flipped horizontally arranged pieces downward (main moved from y={main_y} to y={main_y+1})")
            else:
                print("DEBUG: Couldn't find a valid flip direction for horizontal pieces")
        
        # Only update cooldown and reset wall kick tracking if flip was successful
        if flip_successful:
            # Reset wall kick tracking when flipping
            self.wall_kick_count = 0
            
            # Update the cooldown timer
            self.last_flip_time = current_time
            print("DEBUG: Flip was successful")
        else:
            print("DEBUG: Flip failed")
            
        return flip_successful
        
    def can_flip_vertically(self):
        print("\nDEBUG: can_flip_vertically called")
        main_x, main_y = self.piece_position
        attached_pos = self.attached_position
        print(f"DEBUG: Main piece at ({main_x}, {main_y}), attached position: {attached_pos}")
        
        # Only allow flipping of horizontal pieces between towers
        if attached_pos not in [1, 3]:  # 1 is right, 3 is left
            print(f"DEBUG: Not in a horizontal arrangement (attached_pos = {attached_pos}), cannot flip")
            return False
            
        # Get the positions of main and attached pieces
        attached_x, attached_y = self.get_attached_position_coords()
        print(f"DEBUG: Attached piece at ({attached_x}, {attached_y})")
        
        # For horizontal pieces, check if we have obstructions on both sides
        if attached_pos == 1:  # Attached on right
            # Check if there's a tower or wall to the left of the main piece
            left_x, left_y = main_x - 1, main_y
            is_left_obstructed = (left_x < 0 or 
                                 (left_y >= 0 and left_x < self.grid_width and 
                                  self.puzzle_grid[left_y][left_x] is not None))
            
            # Check if there's a tower or wall to the right of the attached piece
            right_x, right_y = attached_x + 1, attached_y
            is_right_obstructed = (right_x >= self.grid_width or 
                                  (right_y >= 0 and right_x < self.grid_width and 
                                   self.puzzle_grid[right_y][right_x] is not None))
            
            print(f"DEBUG: Left side ({left_x}, {left_y}) obstructed: {is_left_obstructed}")
            print(f"DEBUG: Right side ({right_x}, {right_y}) obstructed: {is_right_obstructed}")
            
            # Both sides must be obstructed to allow flip
            if is_left_obstructed and is_right_obstructed:
                # Check if there's space to flip (vertically)
                up_pos_main = (main_x, main_y - 1)
                up_pos_attached = (attached_x, attached_y - 1)
                can_fit = (self.is_valid_position(up_pos_main[0], up_pos_main[1]) and 
                           self.is_valid_position(up_pos_attached[0], up_pos_attached[1]))
                print(f"DEBUG: Space to flip upward: {can_fit}")
                return can_fit
            else:
                print("DEBUG: Not trapped between towers/walls, cannot flip")
                return False
                
        elif attached_pos == 3:  # Attached on left
            # Check if there's a tower or wall to the right of the main piece
            right_x, right_y = main_x + 1, main_y
            is_right_obstructed = (right_x >= self.grid_width or 
                                  (right_y >= 0 and right_x < self.grid_width and 
                                   self.puzzle_grid[right_y][right_x] is not None))
            
            # Check if there's a tower or wall to the left of the attached piece
            left_x, left_y = attached_x - 1, attached_y
            is_left_obstructed = (left_x < 0 or 
                                 (left_y >= 0 and left_x < self.grid_width and 
                                  self.puzzle_grid[left_y][left_x] is not None))
            
            print(f"DEBUG: Right side ({right_x}, {right_y}) obstructed: {is_right_obstructed}")
            print(f"DEBUG: Left side ({left_x}, {left_y}) obstructed: {is_left_obstructed}")
            
            # Both sides must be obstructed to allow flip
            if is_left_obstructed and is_right_obstructed:
                # Check if there's space to flip (vertically)
                up_pos_main = (main_x, main_y - 1)
                up_pos_attached = (attached_x, attached_y - 1)
                can_fit = (self.is_valid_position(up_pos_main[0], up_pos_main[1]) and 
                           self.is_valid_position(up_pos_attached[0], up_pos_attached[1]))
                print(f"DEBUG: Space to flip upward: {can_fit}")
                return can_fit
            else:
                print("DEBUG: Not trapped between towers/walls, cannot flip")
                return False
                
        return False

    def create_block_particles(self, block_x, block_y, block_color=None, is_breaker=False):
        """Create particles for a breaking block at the given position - simplified version."""
        # If block_color is not provided, try to get it from the grid
        if block_color is None and 0 <= block_y < self.grid_height and 0 <= block_x < self.grid_width:
            if self.puzzle_grid[block_y][block_x] is not None:
                block_color = self.puzzle_grid[block_y][block_x]
                is_breaker = "_breaker" in block_color
            else:
                # Default to red if no color information is available
                block_color = "red"
        
        # Calculate screen position
        side_margin = 100
        top_bottom_margin = 50
        bg_width = self.width - (side_margin * 2)
        bg_height = self.height - (top_bottom_margin * 2)
        
        # Calculate grid dimensions with padding
        grid_total_width = self.grid_width * self.block_size
        grid_total_height = self.grid_height * self.block_size
        grid_padding = 10
        grid_display_width = grid_total_width + (grid_padding * 2)
        grid_display_height = grid_total_height + (grid_padding * 2)
        
        # Center the grid
        grid_x = side_margin + (bg_width - grid_display_width) // 2 + grid_padding
        grid_y = top_bottom_margin + (bg_height - grid_display_height) // 2 - 10 + grid_padding
        
        # Calculate center of the block
        center_x = grid_x + (block_x * self.block_size) + (self.block_size // 2)
        center_y = grid_y + (block_y * self.block_size) + (self.block_size // 2)
        
        # Get base color for particles (simplified)
        base_color = block_color.split('_')[0] if isinstance(block_color, str) else 'red'
        color = self.particle_colors.get(base_color, self.particle_colors['white'])
        
        # Number of particles to create
        num_particles = 20 if is_breaker else 12
        
        # Create simple particles
        for _ in range(num_particles):
            # Random angle and velocity
            angle = random.uniform(0, math.pi * 2)
            speed = random.uniform(30, 80)
            
            # Add particle with simplified properties
            self.particles.append({
                'x': center_x,
                'y': center_y,
                'vx': math.cos(angle) * speed,
                'vy': math.sin(angle) * speed,
                'radius': random.randint(2, 5),
                'color': color,
                'life': random.uniform(0.3, 0.8),  # Lifetime in seconds
                'created': pygame.time.get_ticks() / 1000.0  # Current time in seconds
            })

    def update_and_draw_particles(self, surface, current_time):
        """Update and draw particles with a very simple implementation."""
        # Convert current time to seconds
        current_time_sec = current_time / 1000.0
        
        # Process particles and keep only active ones
        active_particles = []
        
        for p in self.particles:
            # Calculate age and check if still active
            age = current_time_sec - p['created']
            if age < p['life']:
                # Update position
                p['x'] += p['vx'] / 60
                p['y'] += p['vy'] / 60
                
                # Add gravity
                p['vy'] += 60 / 60
                
                # Calculate fade (0-255)
                fade = max(0, min(255, int(255 * (1 - age / p['life']))))
                
                # Create a simple surface for the particle
                size = p['radius'] * 2
                circle_surface = pygame.Surface((size, size), pygame.SRCALPHA)
                pygame.draw.circle(
                    circle_surface,
                    (*p['color'], fade),
                    (p['radius'], p['radius']),
                    p['radius']
                )
                
                # Draw the particle
                surface.blit(circle_surface, (int(p['x'] - p['radius']), int(p['y'] - p['radius'])))
                
                # Keep this particle
                active_particles.append(p)
        
        # Update the particles list
        self.particles = active_particles

    def load_sounds(self):
        """Load sound effects from files in the sounds directory."""
        try:
            # Load sound effects if the files exist
            hover_path = os.path.join('sounds', 'menuhover.wav')  # Changed from hover.wav to menuhover.wav
            click_path = os.path.join('sounds', 'click.mp3')
            
            if os.path.exists(hover_path):
                self.sounds['hover'] = pygame.mixer.Sound(hover_path)
                self.sounds['hover'].set_volume(0.3)  # Set appropriate volume
            
            if os.path.exists(click_path):
                self.sounds['click'] = pygame.mixer.Sound(click_path)
                self.sounds['click'].set_volume(0.5)  # Set appropriate volume
                
            # Load background music if it exists
            music_path = os.path.join('sounds', 'menu_music.ogg')
            if os.path.exists(music_path):
                pygame.mixer.music.load(music_path)
                pygame.mixer.music.set_volume(0.4)  # Set appropriate volume
                pygame.mixer.music.play(-1)  # Loop indefinitely
                
            print("Loaded available sound files")
        except Exception as e:
            print(f"Error loading sounds: {e}")
            
    def load_songs(self):
        """Load MP3 files from the songs directory."""
        try:
            # Create songs directory if it doesn't exist
            songs_dir = os.path.join('sounds', 'songs')
            os.makedirs(songs_dir, exist_ok=True)
            
            # Find all MP3 files in the songs directory
            self.songs = []
            for file in os.listdir(songs_dir):
                if file.lower().endswith('.mp3'):
                    file_path = os.path.join(songs_dir, file)
                    # Extract title and artist from filename (assumed format: "artist - title.mp3")
                    file_name = os.path.splitext(file)[0]
                    parts = file_name.split(' - ', 1)
                    
                    artist = parts[0] if len(parts) > 1 else "Unknown Artist"
                    title = parts[1] if len(parts) > 1 else file_name
                    
                    # Default attribution
                    source = ""
                    license_type = ""
                    
                    # Special case for known songs with proper attribution
                    if "cat cafe" in file_name.lower():
                        source = "Free Music Archive"
                        license_type = "CC BY"
                    
                    self.songs.append({
                        'path': file_path,
                        'title': title,
                        'artist': artist,
                        'filename': file,
                        'source': source,
                        'license': license_type
                    })
            
            # Initialize song info if songs are available
            if self.songs:
                self.current_song_index = 0
                self.song_info = {
                    'title': self.songs[0]['title'],
                    'artist': self.songs[0]['artist'],
                    'source': self.songs[0]['source'],
                    'license': self.songs[0]['license']
                }
                print(f"Loaded {len(self.songs)} songs from songs directory")
                
                # Automatically start playing the first song
                self.play_song()
            else:
                print("No songs found in the songs directory")
                
        except Exception as e:
            print(f"Error loading songs: {e}")
            
    def play_song(self):
        """Play the current song."""
        if not self.songs:
            print("No songs available to play")
            return
            
        try:
            # Stop any currently playing music
            pygame.mixer.music.stop()
            
            # Load and play the current song
            current_song = self.songs[self.current_song_index]
            print(f"Attempting to play: {current_song['path']}")
            
            # Make sure the file exists
            if not os.path.exists(current_song['path']):
                print(f"Error: Song file not found: {current_song['path']}")
                return
                
            # Load and play the song with error checking
            try:
                pygame.mixer.music.load(current_song['path'])
                pygame.mixer.music.set_volume(0.5)  # Set to 50% volume
                pygame.mixer.music.play(-1)  # -1 means loop indefinitely
                
                # Update song info with attribution
                self.song_info = {
                    'title': current_song['title'],
                    'artist': current_song['artist'],
                    'source': current_song['source'],
                    'license': current_song['license']
                }
                
                self.is_playing = True
                print(f"Now playing: {current_song['artist']} - {current_song['title']}")
                
                # Print attribution
                if current_song['source'] and current_song['license']:
                    print(f"Attribution: {current_song['source']} | License: {current_song['license']}")
                    
            except pygame.error as e:
                print(f"Pygame error loading music: {e}")
                # Try alternative approach for MP3 files
                try:
                    sound = pygame.mixer.Sound(current_song['path'])
                    sound.play(-1)  # Loop indefinitely
                    self.sounds['current_song'] = sound  # Store reference to prevent garbage collection
                    self.is_playing = True
                    print(f"Playing as Sound object instead: {current_song['artist']} - {current_song['title']}")
                except Exception as alt_e:
                    print(f"Alternative playback also failed: {alt_e}")
                    
        except Exception as e:
            print(f"Error playing song: {e}")
            self.is_playing = False
    
    def pause_song(self):
        """Pause or unpause the current song."""
        if not self.songs:
            return
            
        if self.is_playing:
            pygame.mixer.music.pause()
            self.is_playing = False
            print("Music paused")
        else:
            pygame.mixer.music.unpause()
            self.is_playing = True
            print("Music resumed")
    
    def next_song(self):
        """Play the next song in the playlist."""
        if not self.songs:
            return
            
        # Move to next song
        self.current_song_index = (self.current_song_index + 1) % len(self.songs)
        self.play_song()
    
    def prev_song(self):
        """Play the previous song in the playlist."""
        if not self.songs:
            return
            
        # Move to previous song
        self.current_song_index = (self.current_song_index - 1) % len(self.songs)
        self.play_song()
    
    def draw_mp3_player(self):
        """Draw the MP3 player in the bottom-right corner of the screen."""
        if not self.songs:
            return
            
        # Define player dimensions and position
        player_width = 240  # More compact width
        player_height = 150  # Adjusted height
        margin = 20
        x = self.width - player_width - margin
        y = self.height - player_height - margin
        
        # Draw player background with semi-transparency
        player_surface = pygame.Surface((player_width, player_height), pygame.SRCALPHA)
        player_surface.fill((30, 30, 50, 220))  # Dark blue with higher transparency
        
        # Draw border with purple glow effect
        border_color = (150, 100, 200, 255)  # Purple
        pygame.draw.rect(player_surface, border_color, (0, 0, player_width, player_height), 2, border_radius=10)
        
        # Add a subtle gradient effect at the top
        gradient_height = 20
        for i in range(gradient_height):
            alpha = 100 - (i * 5)  # Gradually decreasing alpha
            pygame.draw.line(player_surface, (200, 150, 250, alpha), 
                          (3, 3 + i), (player_width - 3, 3 + i), 1)
        
        # Draw player title
        title_font = pygame.font.SysFont(None, 28)
        title_text = title_font.render("MP3 Player", True, (220, 220, 255))
        player_surface.blit(title_text, (player_width//2 - title_text.get_width()//2, 8))  # Centered
        
        # Draw current song info in the top section
        if self.song_info:
            # Text fonts
            song_font = pygame.font.SysFont(None, 22)
            attribution_font = pygame.font.SysFont(None, 18)
            
            # Song title - centered
            title = self.song_info['title']
            title_text = song_font.render(f"Title: {title}", True, (255, 255, 255))
            player_surface.blit(title_text, (15, 35))
            
            # Artist - centered
            artist = self.song_info['artist']
            artist_text = song_font.render(f"Artist: {artist}", True, (220, 220, 255))
            player_surface.blit(artist_text, (15, 58))
            
            # Source and license on same line with less space if both exist
            source_line_y = 80
            if self.song_info.get('source'):
                source_text = attribution_font.render(f"Source: {self.song_info['source']}", True, (200, 200, 240))
                player_surface.blit(source_text, (15, source_line_y))
            
            # License on next line
            if self.song_info.get('license'):
                license_text = attribution_font.render(f"License: {self.song_info['license']}", True, (200, 200, 240))
                player_surface.blit(license_text, (15, source_line_y + 20))
        
        # Define button dimensions and spacing
        button_size = 32  # Slightly smaller buttons
        button_y = player_height - button_size - 12  # Position at bottom
        button_spacing = 10  # Reduced spacing
        
        # Center align the control button group
        total_buttons_width = (button_size * 3) + (button_spacing * 2)
        button_start_x = (player_width - total_buttons_width) // 2
        
        # Draw control buttons (previous, play/pause, next)
        button_x = button_start_x
        
        # Draw each button with improved styling
        for btn_type in ['prev', 'play', 'next']:
            # Button position
            btn_rect = pygame.Rect(button_x, button_y, button_size, button_size)
            
            # Button gradient background
            pygame.draw.rect(player_surface, (60, 60, 100), btn_rect, 0, border_radius=6)
            pygame.draw.rect(player_surface, (80, 80, 120), 
                           (btn_rect.x, btn_rect.y, btn_rect.width, btn_rect.height//2), 
                           0, border_radius=6)
            
            # Button border with glow effect for active state
            border_color = (150, 150, 220)
            if btn_type == 'play' and self.is_playing:
                border_color = (180, 180, 255)  # Brighter border for active state
                glow_surface = pygame.Surface((button_size+4, button_size+4), pygame.SRCALPHA)
                pygame.draw.rect(glow_surface, (180, 180, 255, 70), 
                               (0, 0, button_size+4, button_size+4), 0, border_radius=8)
                player_surface.blit(glow_surface, (btn_rect.x-2, btn_rect.y-2))
            
            # Button border
            pygame.draw.rect(player_surface, border_color, btn_rect, 2, border_radius=6)
            
            # Draw button symbols
            if btn_type == 'prev':
                # Previous button symbol (<<)
                pygame.draw.polygon(player_surface, (220, 220, 255), [
                    (button_x + button_size//2 - 2, button_y + button_size//2),
                    (button_x + 10, button_y + 10),
                    (button_x + 10, button_y + button_size - 10)
                ])
                pygame.draw.polygon(player_surface, (220, 220, 255), [
                    (button_x + button_size//2 - 10, button_y + button_size//2),
                    (button_x + button_size//2 - 2, button_y + 10),
                    (button_x + button_size//2 - 2, button_y + button_size - 10)
                ])
            elif btn_type == 'play':
                if self.is_playing:
                    # Pause symbol (||)
                    pygame.draw.rect(player_surface, (220, 220, 255), 
                                  (button_x + 10, button_y + 8, 5, button_size - 16))
                    pygame.draw.rect(player_surface, (220, 220, 255), 
                                  (button_x + 17, button_y + 8, 5, button_size - 16))
                else:
                    # Play symbol (►)
                    pygame.draw.polygon(player_surface, (220, 220, 255), [
                        (button_x + 12, button_y + 8),
                        (button_x + 24, button_y + button_size//2),
                        (button_x + 12, button_y + button_size - 8)
                    ])
            elif btn_type == 'next':
                # Next button symbol (>>)
                pygame.draw.polygon(player_surface, (220, 220, 255), [
                    (button_x + button_size//2 + 2, button_y + button_size//2),
                    (button_x + button_size - 10, button_y + 8),
                    (button_x + button_size - 10, button_y + button_size - 8)
                ])
                pygame.draw.polygon(player_surface, (220, 220, 255), [
                    (button_x + button_size//2 + 10, button_y + button_size//2),
                    (button_x + button_size//2 + 2, button_y + 8),
                    (button_x + button_size//2 + 2, button_y + button_size - 8)
                ])
                
            # Move to next button position
            button_x += button_size + button_spacing
        
        # Draw progress/volume bar above the buttons
        volume_width = player_width - 30  # Full width minus margins
        volume_height = 8  # Smaller height
        volume_x = 15
        volume_y = button_y - volume_height - 12  # Position above buttons with space
        
        # Volume background with rounded corners
        volume_bg_rect = pygame.Rect(volume_x, volume_y, volume_width, volume_height)
        pygame.draw.rect(player_surface, (50, 50, 70), volume_bg_rect, 0, border_radius=4)
        
        # Current volume level with gradient
        volume_level = 0.7
        volume_level_width = int(volume_width * volume_level)
        volume_rect = pygame.Rect(volume_x, volume_y, volume_level_width, volume_height)
        
        if volume_level_width > 0:
            # Main volume fill
            pygame.draw.rect(player_surface, (100, 170, 220), volume_rect, 0, border_radius=4)
            
            # Gradient highlight
            highlight_height = volume_height // 2
            highlight_rect = pygame.Rect(volume_x, volume_y, volume_level_width, highlight_height)
            pygame.draw.rect(player_surface, (150, 200, 255), highlight_rect, 0, border_radius=4)
        
        # Blit the player surface to the screen
        self.screen.blit(player_surface, (x, y))
        
        # Store button positions for hit detection (in screen coordinates)
        self.mp3_player_buttons = {
            'prev': pygame.Rect(x + button_start_x, y + button_y, button_size, button_size),
            'play': pygame.Rect(x + button_start_x + button_size + button_spacing, y + button_y, button_size, button_size),
            'next': pygame.Rect(x + button_start_x + (button_size + button_spacing) * 2, y + button_y, button_size, button_size)
        }

    def run(self):
        """Main loop for the application."""
        clock = pygame.time.Clock()
        running = True
        
        # Initialize mp3_player_buttons attribute
        self.mp3_player_buttons = {}
        
        while running:
            # Don't clear hovered_buttons every frame - this is why the sound plays repeatedly
            # self.hovered_buttons.clear()
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                
                # Handle mouse clicks for MP3 player
                if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:  # Left click
                    mouse_pos = pygame.mouse.get_pos()
                    
                    # Check if click is on MP3 player buttons
                    if hasattr(self, 'mp3_player_buttons'):
                        for button_name, button_rect in self.mp3_player_buttons.items():
                            if button_rect.collidepoint(mouse_pos):
                                if button_name == 'prev':
                                    self.prev_song()
                                elif button_name == 'play':
                                    self.pause_song()
                                elif button_name == 'next':
                                    self.next_song()
                
                # Track key presses
                if event.type == pygame.KEYDOWN:
                    self.keys_pressed[event.key] = True
                    self.last_key_action_time[event.key] = pygame.time.get_ticks()
                    
                    if event.key == pygame.K_ESCAPE and self.current_screen == "game":
                        self.set_screen("main_menu")
                        self.game_active = False
                    
                    # Game controls when in game mode
                    if self.current_screen == "game" and self.game_active:
                        if event.key == pygame.K_UP:
                            # Try to flip first if pieces are arranged horizontally and can flip
                            if ((self.attached_position == 1 or self.attached_position == 3) and 
                                self.can_flip_vertically()):
                                # Attempt to flip vertically
                                flip_success = self.flip_pieces_vertically()
                                if flip_success:
                                    # If flip succeeded, we're done
                                    continue
                            
                            # If flip didn't succeed or wasn't possible, do normal rotation
                            self.rotate_attached_piece(-1)  # Counter-clockwise
                        elif event.key == pygame.K_DOWN:
                            # Try to flip first if pieces are arranged horizontally and can flip
                            if ((self.attached_position == 1 or self.attached_position == 3) and 
                                self.can_flip_vertically()):
                                # Attempt to flip vertically
                                flip_success = self.flip_pieces_vertically()
                                if flip_success:
                                    # If flip succeeded, we're done
                                    continue
                            
                            # If flip didn't succeed or wasn't possible, do normal rotation
                            self.rotate_attached_piece(1)  # Clockwise
                        elif event.key == pygame.K_LEFT:
                            self.move_piece(-1, 0)  # Move left
                        elif event.key == pygame.K_RIGHT:
                            self.move_piece(1, 0)  # Move right
                        elif event.key == pygame.K_SPACE:
                            self.current_fall_speed = self.accelerated_fall_speed
                        # Remove F key control for flipping
                        # elif event.key == pygame.K_f:
                        #     self.flip_pieces_vertically()  # New flip functionality
                
                # Track key releases
                if event.type == pygame.KEYUP:
                    if event.key in self.keys_pressed:
                        del self.keys_pressed[event.key]
                    if event.key in self.last_key_action_time:
                        del self.last_key_action_time[event.key]
                    
                    # Reset speed when spacebar is released
                    if event.key == pygame.K_SPACE and self.current_screen == "game":
                        self.current_fall_speed = self.normal_fall_speed
            
            # Handle continuous key presses for game controls
            if self.current_screen == "game" and self.game_active:
                self.update_falling_piece()
            
            # Draw the current screen
            if self.current_screen == "main_menu":
                self.draw_main_menu()
            elif self.current_screen == "settings":
                self.draw_settings_menu()
            elif self.current_screen == "academy_basics":
                self.draw_academy_basics()
            elif self.current_screen == "lesson_basics_1":
                self.draw_lesson_basics_1()
            elif self.current_screen == "lesson_basics_2":
                self.draw_lesson_basics_2()
            elif self.current_screen == "game":
                # Process any chain reactions first
                if self.chain_reaction_in_progress:
                    self.activate_breaker_blocks()
                    
                # Only update falling piece if no chain reaction is in progress
                if self.game_active and not self.chain_reaction_in_progress:
                    self.update_falling_piece()
                
                # Draw game screen (which now includes cluster detection and glowing)
                self.draw_game_screen()
                
                # Process breaking animations - optimize rendering
                if self.breaking_blocks:
                    current_animation_time = pygame.time.get_ticks() - self.breaking_animation_start
                    
                    # Get grid position (needed for animation)
                    side_margin = 100  # Same as in draw_game_screen
                    top_bottom_margin = 50
                    bg_width = self.width - (side_margin * 2)
                    bg_height = self.height - (top_bottom_margin * 2)
                    
                    # Calculate grid dimensions with padding
                    grid_total_width = self.grid_width * self.block_size
                    grid_total_height = self.grid_height * self.block_size
                    grid_padding = 10
                    grid_display_width = grid_total_width + (grid_padding * 2)
                    grid_display_height = grid_total_height + (grid_padding * 2)
                    
                    # Center the grid
                    grid_x = side_margin + (bg_width - grid_display_width) // 2 + grid_padding
                    grid_y = top_bottom_margin + (bg_height - grid_display_height) // 2 - 10 + grid_padding
                    
                    # Draw breaking effects
                    for block_x, block_y, start_time, delay, block_color, is_breaker in self.breaking_blocks:
                        # Only start animation after delay
                        if current_animation_time >= delay:
                            # Calculate animation progress (0.0 to 1.0)
                            block_progress = min(1.0, (current_animation_time - delay) / 
                                               (self.breaking_animation_duration - delay))
                            
                            # Only draw breaking animation if the block still exists
                            if (0 <= block_y < self.grid_height and 
                                0 <= block_x < self.grid_width and 
                                self.puzzle_grid[block_y][block_x] is not None):
                                
                                # Calculate screen position
                                piece_x = grid_x + (block_x * self.block_size)
                                piece_y = grid_y + (block_y * self.block_size)
                                
                                # Calculate center position
                                center_x = piece_x + self.block_size // 2
                                center_y = piece_y + self.block_size // 2
                                
                                # Draw simple flashing effect
                                flash_alpha = int(150 * (1 - block_progress))
                                flash_surface = pygame.Surface((self.block_size, self.block_size), pygame.SRCALPHA)
                                flash_surface.fill((255, 255, 255, flash_alpha))
                                self.screen.blit(flash_surface, (piece_x, piece_y))
                                
                                # Draw simple crack lines
                                for i in range(4):
                                    angle = math.pi / 2 * i
                                    length = self.block_size * 0.7 * block_progress
                                    end_x = center_x + math.cos(angle) * length
                                    end_y = center_y + math.sin(angle) * length
                                    
                                    pygame.draw.line(
                                        self.screen, 
                                        (255, 255, 255), 
                                        (center_x, center_y),
                                        (end_x, end_y),
                                        2
                                    )
                
                # Update and draw particles - simplified version
                if self.particles:
                    self.update_and_draw_particles(self.screen, pygame.time.get_ticks())
            
            pygame.display.flip()
            clock.tick(120)  # Increase to 120 FPS for smoother animations

if __name__ == "__main__":
    client = GameClient()
    client.run() 