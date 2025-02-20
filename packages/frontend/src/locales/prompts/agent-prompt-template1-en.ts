export const agentPromptTemplate1 = 'Based on the user\'s input: "${input}", Output a JSON. This JSON is a questionnaire. The user will input inputB1 - N, and after clicking submit, the strings in the prompt array will be sequentially provided to the AI, and the content will be returned to the user in sequence. You need to write all the questions to be asked to the user in inputBx, and in the promptBlock, no questions should be asked. Only based on the answers of the user in the <def></def> tag of inputBn, a prompt for constructing a solution or answer should be built. Design how many times the prompt is needed and the content of each prompt according to the quality requirements to meet the requirements. When outputting, output in JSON format, following the example and rules below.Based on the user\'s input, figure out what purpose the user is most likely to achieve. Then inputB1 - BN are 1 - 3 key input factors (parameters) that you analyze are needed to clarify with the user to achieve this purpose. Fill in the <def></def> default value with "the content of the option that the user is most likely to fill in after seeing the content of this inputBn", for example, "inputB1": "Article topic <def>Trends in technological development</def>" \nThen inputB2 - BN are 1 - 3 key input factors (parameters) that you analyze are needed to achieve this goal. Fill in the option with the highest probability of this parameter in the <def></def> default value.\nThen determine whether the user ultimately needs a long reply or a short reply. If it is a long reply, multiple promptBlocks may be required. If it is a short reply, one promptBlock is sufficient. Since inputB1 - N is input by the user at once, promptBlock1 - N can be captured by placeholders at any time. The promptBlock should be written with an optimal strategy. That is, unless a large amount of complex writing is required, the problem should generally be solved in one promptBlock. The 2 - Nth promptBlocks must reference at least one of the previous promptBlocks. When writing promptBlock1, the user has already completed the input of inputB1 - N, and there is no need to ask the user again in the promptBlock. The typical writing of promptBlock1 is: "The following is the basic information: " The writing method is as follows.\nOnly output the JSON file, and do not output other irrelevant content.\nThe following is an example:\nUser input: What\'s your favorite animal?\nAfter analysis, the AI asks the user to input three animals, with the default values in <def></def>. Then it calls the AI twice. The first call\'s prompt is: "List one breed for each of the following animals, and only output the breed name without other irrelevant information. Cat Dog Chicken"\nThe second call\'s prompt is: "Which one do you like the most: Persian cat, Labrador, White Leghorn chicken? Output the result directly without explanation."\n(The Persian cat, Labrador, and White Leghorn chicken in the second call are the results generated by the first prompt.)\nSpecial note: In the JSON file, "promptBlocks": [ string1,string2....] is an array. Each element in this array corresponds to promptBlock1 - N. Therefore, when a placeholder like ${promptBlock1} appears in a certain promptBlock, this placeholder will be replaced by the reply obtained after sending the prompt in promptBlock1 to the AI. This function is similar to the practice of stacking historical conversation contexts in large language models, but it is more selective. Therefore, when constructing a JSON file with multiple promptBlocks, each promptblock must contain at least one type of placeholder to accurately select the required context. Because each of the prompts in the sequence is sent to the large language model as a separate conversation without context.\nExample of JSON file:\nExample of multiple promptBlocks\n{\n"adminInputs": {\n"inputB1": "Animal 1 <def>Cat</def>",\n"inputB2": "Animal 2 <def>Dog</def>",\n"inputB3": "Animal 3 <def>Chicken</def>"\n},\n"promptBlocks": {\n"promptBlock1": "List one breed for each of the following animals, and only output the breed name without other irrelevant information. ${inputB1} ${inputB2} ${inputB3}",\n"promptBlock2": "Which one do you like the most: ${promptBlock1} Output the result directly without explanation"\n}\n}\nExample of a single promptBlock\nHypertensive medication dispenser:\n{\n"adminInputs": {\n"inputB1": "Patient\'s gender",\n"inputB2": "Patient\'s age",\n"inputB3": "Systolic blood pressure (high pressure)",\n"inputB4": "Diastolic blood pressure (low pressure)",\n"inputB5": "Remarks (such as diabetes, kidney damage, etc.)"\n},\n"promptBlocks": {\n"promptBlock1":"The following is the basic information of the patient:\nGender: ${inputB1}\nAge: ${inputB2}\nSystolic blood pressure: ${inputB3}\nDiastolic blood pressure: ${inputB4}\nOther information, such as comorbidities: ${inputB5}\n\nBased on the following diagnostic criteria, medications, and drug list, make a diagnosis and medication recommendation. The output format is:\nDescription of the patient\'s hypertensive condition: xxxxxx\nRecommended medications, dosages, and reasons: xxxxxx\nPay attention to possible side effects: xxxxxxxx\nTarget blood pressure, medication evaluation period, and rare precautions: xxxxxx\nDisclaimer: xxxx\n\nDiagnostic criteria are as follows:\nEvaluate blood pressure levels and classifications\n\nMild hypertension (140 - 159/90 - 99 mmHg)\nModerate hypertension (160 - 179/100 - 109 mmHg)\nSevere hypertension (≥180/110 mmHg)\n\nConsider patient characteristics:\n\nAge:\n\n≥65 - year - old elderly: First choose CCB or diuretics, avoid significant blood pressure reduction\nMiddle - aged people: Can choose all first - line drugs\nPeople < 55 years old: Can give priority to ACEI/ARB\n\nGender:\n\nReproductive - age women: ACEI/ARB are prohibited\nPost - menopausal women: Pay attention to the risk of osteoporosis, use diuretics with caution\n\n\nInitial medication principles:\n\nMild hypertension: Start with a single - drug small dose\nModerate to severe hypertension: Consider small - dose combination therapy\nIf the systolic blood pressure is > 20 mmHg or the diastolic blood pressure is > 10 mmHg above the target value: Consider dual - drug combination\n\nSpecial considerations:\n\nIsolated systolic hypertension: Give priority to CCB or diuretics\nCombined with heart failure: Give priority to ACEI/ARB + β - blocker\nCombined with diabetes: Give priority to ACEI/ARB\nCombined with renal insufficiency: Give priority to ACEI/ARB (unless the renal function is severely impaired)\n\nMonitoring and adjustment principles:\n\nEvaluate the efficacy and tolerability 2 weeks after starting treatment\nConsider adjusting the plan if the target is not reached within 4 - 6 weeks\nPay attention to monitoring electrolytes and renal function\nPay attention to the patient\'s compliance and lifestyle improvement\n\nDrug list is as follows:\n\nCalcium channel blockers (CCB)\n\nAmlodipine: Reduces blood pressure by 8 - 12/4 - 6 mmHg (systolic/diastolic)\nMain side effects: Ankle edema, headache, facial flushing, tachycardia\nInteractions: Avoid taking with grapefruit juice; Use with caution when combined with β - blockers, may aggravate heart block\n\nAngiotensin - converting enzyme inhibitors (ACEI)\n\nCaptopril/Enalapril: Reduces blood pressure by 8 - 12/4 - 8 mmHg\nMain side effects: Dry cough (10 - 20% of patients), hyperkalemia, angioedema\nInteractions: Contraindicated to combine with ARB; Avoid using with potassium - sparing diuretics; Contraindicated in pregnant women\n\nAngiotensin receptor blockers (ARB)\n\nValsartan/Telmisartan: Reduces blood pressure by 8 - 11/5 - 7 mmHg\nMain side effects: Dizziness, hyperkalemia (lower incidence than ACEI)\nInteractions: Contraindicated to combine with ACEI; Avoid using with potassium - sparing diuretics; Contraindicated in pregnant women\n\nThiazide diuretics\n\nHydrochlorothiazide: Reduces blood pressure by 9 - 13/4 - 6 mmHg\nMain side effects: Hypokalemia, hyperuricemia, increased blood sugar, dyslipidemia\nInteractions: Avoid using with glucocorticoids; May increase the risk of lithium toxicity when combined with lithium agents\n\nβ - blockers\n\nMetoprolol/Bisoprolol: Reduces blood pressure by 8 - 10/6 - 8 mmHg\nMain side effects: Fatigue, bradycardia, bronchospasm, masks hypoglycemic symptoms\nInteractions: Avoid using with verapamil - type calcium channel blockers; Monitor blood sugar when combined with insulin/sulfonylurea hypoglycemic drugs"\n}\n}\nOnly output the JSON file, and do not output other irrelevant content.';
