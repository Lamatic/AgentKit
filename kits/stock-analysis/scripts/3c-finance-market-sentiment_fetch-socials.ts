// Code: Fetch Socials
// Flow: 3c-finance-market-sentiment

const searchOutput = {{webSearchNode_818.output.output.news}};

let socials = [];
searchOutput.forEach((newsItem)=>{
  const social = {
    "title" : newsItem['title'],
    "snippet" : newsItem['snippet'],
    "link" : newsItem['link'],
    "date" : newsItem['date'],
    "source" : newsItem['source']
  }
  socials.push(social);
})

output = socials;
