const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const filePath = './data/data.json';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

app.get('/scrape', async (req, res) => {
    try {
        const url = 'https://audiohype.io/';
        const data = await axios.get(url);
        const $ = cheerio.load(data.data);
        const scrapedData = [];

        await Promise.all(
            $("div.elementor-posts-container article").map(async (index, el) => {
                let imgSrc = $(el).find("a div img").attr('data-src');
                let tag = $(el).find("div.elementor-post__badge").text();
                let title = $(el).find("div.elementor-post__text h3 a").text();
                let postLink = $(el).find("div.elementor-post__text h3 a").attr('href');
                let desc = $(el).find("div.elementor-post__text div.elementor-post__excerpt p").text();

                let obj = {
                    title: title,
                    description: desc,
                    image: imgSrc,
                    postLink: postLink,
                    tag: tag,
                    postLinkData: [],
                };

                scrapedData.push(obj);

                const data2 = await axios.get(postLink);
                const $p = cheerio.load(data2.data);

                $p("div.elementor-element-c8f80e2 div.elementor-widget-container").each((index, el) => {
                    let postObjData = {
                        heading: [],
                        paras: [],
                        figure: [],
                    };

                    $p(el).find('h2.wp-block-heading').each((indexOfHaeding, headingElements)=>{
                        postObjData.heading.push($p(headingElements).text());
                    })


                    $p(el).find('p').each((indexOfParas, parasElements)=>{
                        postObjData.paras.push($p(parasElements).text());
                    })


                    $p(el).find('figure.wp-block-image').each((indexOfFigure, figureElements)=>{

                        $p(figureElements).find("img").each((indexOfImg, imgElement)=> {
                            
                            postObjData.figure.push($p(imgElement).attr("data-src"));
                        })
                           

                    })


                    obj.postLinkData.push(postObjData);
                });

            })
        );


        const jsonString = JSON.stringify(scrapedData, null, 2); // the third argument (2) is for indentation

        fs.writeFile(filePath, jsonString, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
            } else {
                console.log(`Data written to ${filePath}`);
            }
        });

        res.json({ data: scrapedData });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
