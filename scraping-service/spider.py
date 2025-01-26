from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time
import os

def scrape_jobs():
    # Set up Chrome options
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    # Initialize the driver
    driver = webdriver.Chrome(options=options)
    
    try:
        # Navigate to the page
        url = 'https://thehub.io/jobs?search=Marketing&countries=Denmark'
        print(f'Navigating to {url}')
        driver.get(url)
        
        # Wait for job cards to load
        print('Waiting for job cards to load...')
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "job-card"))
        )
        
        # Let the page fully render
        time.sleep(2)
        
        # Find all job cards
        job_cards = driver.find_elements(By.CLASS_NAME, "job-card")
        print(f'Found {len(job_cards)} job cards')
        
        jobs = []
        for card in job_cards:
            try:
                job = {
                    'title': card.find_element(By.CSS_SELECTOR, "h3").text.strip(),
                    'company': card.find_element(By.CSS_SELECTOR, ".company").text.strip(),
                    'location': card.find_element(By.CSS_SELECTOR, ".location").text.strip(),
                    'url': card.find_element(By.TAG_NAME, "a").get_attribute("href"),
                    'description': card.find_element(By.CSS_SELECTOR, ".description").text.strip(),
                    'source': 'TheHub'
                }
                print(f'Extracted job: {job}')
                jobs.append(job)
            except Exception as e:
                print(f'Error extracting job: {e}')
                continue
            
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
            
        # Save to JSON file
        with open('data/jobs.json', 'w') as f:
            json.dump(jobs, f, indent=2)
            print(f'Saved {len(jobs)} jobs to data/jobs.json')
            
    finally:
        driver.quit()

if __name__ == '__main__':
    scrape_jobs()
