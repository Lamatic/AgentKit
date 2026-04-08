let content = {{webSearchNode_683.output.output.organic }}
let links = []

for (idx in content) {
  console.log(content[idx]['link'])
  links.push(content[idx]['link'])
}

console.log(links)

let output = links[0]
return output