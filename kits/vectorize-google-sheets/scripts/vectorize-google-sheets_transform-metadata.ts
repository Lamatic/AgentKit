let vectors = {{vectorizeNode_177.output.vectors}};
let metadataProps = [];

let metadata = {}
metadata["content"] = {{ codeNode_331.output }}[0]

const row = {{ triggerNode_1.output }}
metadata['employee_id'] = row['Employee ID']
metadata['name'] = row['Name']
metadata['designation'] = row['Designation']
metadata['cost_INR'] = row['CTC per month (INR)']
metadata['cost_CAD'] = row['CTC per month (CND)']
metadata['billing_CAD'] = row['Billing to Dua PC (CND)']
metadata['billing_rate'] = row['Billing price per hour (assuming 160 hours)']
metadata['remarks'] = row['Remarks']
metadata["file_name"] = 'Employee Costing Table'
metadataProps.push(metadata)

console.log("finaldata:", {"metadata": metadataProps, "vectors": vectors});
output = {"metadata": metadataProps, "vectors": vectors}