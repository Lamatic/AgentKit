const responseString = {{ LLMNode_888.output.generatedResponse }}

data = JSON.parse(responseString);
let prod_d = [];
for (let i = 0; i < data.length; i++) {
  prod_d[i] = {
    "Product name": data[i].name,
    "Product description": data[i].description,
    "Product link": `https://www.google.com/search?q=${encodeURI(data[i].name)}&tbm=shop`
  }
}
output = prod_d