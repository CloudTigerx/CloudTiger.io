import pygame
import os

# Initialize pygame
pygame.init()

# Set up the display window
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Puzzle Assets Check")

# Load the puzzle assets
asset_folder = "C:/Users/justi/OneDrive/Desktop/puzzleassets"
assets = {}

# Try to load each image and get its dimensions
print("Loading puzzle assets...")
for filename in os.listdir(asset_folder):
    if filename.endswith(".png"):
        path = os.path.join(asset_folder, filename)
        try:
            img = pygame.image.load(path)
            assets[filename] = img
            print(f"{filename}: Size: {img.get_width()}x{img.get_height()}, File size: {os.path.getsize(path) / 1024:.2f} KB")
        except pygame.error as e:
            print(f"Error loading {filename}: {e}")

# Set up font
font = pygame.font.SysFont(None, 24)

# Main loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Fill the screen with white
    screen.fill((255, 255, 255))
    
    # Display images in a row with scaled dimensions
    x = 50
    y = 50
    max_height = 0
    
    for name, img in assets.items():
        # Scale down the image to be at most 200x200
        img_width, img_height = img.get_width(), img.get_height()
        scale = min(200 / img_width, 200 / img_height)
        scaled_width, scaled_height = int(img_width * scale), int(img_height * scale)
        
        scaled_img = pygame.transform.scale(img, (scaled_width, scaled_height))
        screen.blit(scaled_img, (x, y))
        
        # Draw the filename below the image
        text = font.render(name, True, (0, 0, 0))
        screen.blit(text, (x, y + scaled_height + 10))
        
        # Draw the dimensions below the filename
        dims = font.render(f"{img_width}x{img_height}", True, (0, 0, 0))
        screen.blit(dims, (x, y + scaled_height + 35))
        
        # Move to the next position
        x += scaled_width + 50
        max_height = max(max_height, scaled_height + 60)
        
        # Wrap to next row if we run out of space
        if x > 700:
            x = 50
            y += max_height
            max_height = 0
    
    # Add some instructions
    instruction = font.render("Press any key to close this window", True, (0, 0, 0))
    screen.blit(instruction, (50, 550))
    
    # Update the display
    pygame.display.flip()
    
    # Also break out of the loop if a key is pressed
    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN:
            running = False

# Quit pygame
pygame.quit() 