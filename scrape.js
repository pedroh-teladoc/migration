const fs = require('fs').promises;
const path = require('path');
const jsdom = require('jsdom');

async function getUrlsFromCsv() {
  const csvFilePath = path.join(__dirname, 'migration-url.csv');
  console.log('CSV file path: ', csvFilePath); 
  const csvData = await fs.readFile(csvFilePath, 'utf-8'); 
  const parsedCsv = csvData.split('\n').map(line => line.replace('\r', '').split(',')); 
  const urls = parsedCsv.map(row => row[0]);
  return urls;
}

async function getFeaturedImagesFromUrls(urls) {
  const featuredImages = [];
  const convertedImages = [];
  let count = 0;
  for (const url of urls) {
    count++;
    // These return 404 errors
    if(url.includes('https://www.teladoc.com/health-talk/?')){
        featuredImages.push('');
        continue;
    }
    const response = await fetch(url)
        .then(res => res.text())
        .then(html => {
            const doc = new jsdom.JSDOM(html);
            if(doc != null){
                if(doc.window != null){
                    if(doc.window.document != null){
                        const image = doc.window.document.querySelector('.featured-image').querySelector('img');
                        const convertedImage = image.src.split('/').pop();
                        if(image) {
                            featuredImages.push(image.src);
                            convertedImages.push(convertedImage);
                            console.log(count)
                        }else{
                            featuredImages.push('');
                        }
                    }else{
                        console.log('No document: ', url);
                    }
                }else{
                    console.log('No window: ', url);
                }
            }else{
                console.log('404: ', url);
            }
        })
  }
  return featuredImages;
}

getUrlsFromCsv()
  .then(urls => {
    getFeaturedImagesFromUrls(urls)
      .then(featuredImages => {
        // Update CSV with featured images
        const csvData = urls.map((url, index) => `${url},${featuredImages[index]}`).join('\n');
        fs.writeFile('migration-url.csv', csvData, 'utf-8')
          .then(() => console.log('CSV created successfully with featured images!'))
          .catch(err => console.error(err));
        
      })
      .catch(err => console.error(err));
    console.log(urls);
  })
  .catch(err => console.error(err));
