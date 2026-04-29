import json 
with open('company_identifiers.json', 'r') as file:
    data = json.load(file)
#data["company_identifiers"] = data["company_identifiers"].reverse()
#vals = data["company_identifiers"]
#vals.reverse()
data["company_identifiers"].reverse()
print(data)

with open('company_identifiers_reversed.json','w') as file:
    json.dump(data,file)
