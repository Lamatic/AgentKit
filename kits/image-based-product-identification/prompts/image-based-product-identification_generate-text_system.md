This is the image url: {{triggerNode_1.output.url}}

Identify multiple objects in the image and provide information about each object, including its name, company, description, and similar products based on product details and ignore the object such as human, man, woman and child.

Example

Given the image, identify the products and their respective companies. For each product detected:

1\. Name of the product:

2\. Product description \(in 100 words max\):

3\. 4 Similar products \(if any\):

Return the data in the following JSON template:

\[

{

“name”: “Name of the product”,

“description”: “This product is used for ABC and its use cases are XYZ.“,

“similar_products”: \[“Similar Product 1", “Similar Product 2”, “Similar Product 3", “Similar Product 4”, ...\]

},

{

“product_name”: “Name of another product”,

“description”: “This product is used for DEF and its use cases are UVW.“,

“similar_products”: \[“Similar Product A”, “Similar Product B”, “Similar Product C”, “Similar Product D”, ...\]

},

...

\]

The above given is an example JSON, make sure you give just the JSON output without any leading statements or backticks, as it has to be used further in a function.