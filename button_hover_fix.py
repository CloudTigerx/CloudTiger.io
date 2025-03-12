"""
This file demonstrates how to fix the button hover sound issue.

Replace the relevant parts in resolution_client.py with these changes:

1. In the __init__ method, replace button_hovered_last_frame with hovered_buttons set
2. Update the create_button method to track individual buttons
3. Clear the hovered_buttons set at the beginning of each frame in run()
"""

# 1. In __init__ method replace:
"""
# Sound flags to prevent repeated sounds
self.last_hover_sound_time = 0
self.hover_sound_cooldown = 100  # ms
self.button_hovered_last_frame = False
"""

# with:
"""
# Sound flags to prevent repeated sounds
self.last_hover_sound_time = 0
self.hover_sound_cooldown = 100  # ms
self.hovered_buttons = set()  # Track which buttons are currently being hovered
"""


# 2. In create_button method replace:
"""
# Play hover sound (with cooldown to prevent sound spam)
current_time = pygame.time.get_ticks()
if hover and not self.button_hovered_last_frame and 'hover' in self.sounds:
    if current_time - self.last_hover_sound_time > self.hover_sound_cooldown:
        self.sounds['hover'].play()
        self.last_hover_sound_time = current_time
        self.button_hovered_last_frame = True
elif not hover:
    self.button_hovered_last_frame = False
"""

# with:
"""
# Create a unique identifier for this button based on position and text
button_id = f"{x}_{y}_{text}"

# Play hover sound only when mouse first enters the button
current_time = pygame.time.get_ticks()
if hover:
    # If this button wasn't hovered before, play sound
    if button_id not in self.hovered_buttons and 'hover' in self.sounds:
        if current_time - self.last_hover_sound_time > self.hover_sound_cooldown:
            self.sounds['hover'].play()
            self.last_hover_sound_time = current_time
    
    # Add this button to the set of currently hovered buttons
    self.hovered_buttons.add(button_id)
else:
    # If this button was previously hovered, remove it
    if button_id in self.hovered_buttons:
        self.hovered_buttons.remove(button_id)
"""


# 3. At the beginning of each frame in run(), you might want to clear the hovered buttons 
# set for a fresh tracking each frame. Add near the beginning of the run method loop:
"""
# Inside the main loop in run method
# Reset hovered buttons set at the beginning of each frame
self.hovered_buttons.clear()
""" 