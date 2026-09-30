const rawQuestions = [
    
    {
        text: "[Refer to Box 1] Your classmate said that each of the four expressions in Box 1 is equivalent to 1. Verify what your classmate said by computing the value for the number expression 4×4 - 5×3.",
        options: ["0", "1", "2", "-1"],
        answer: "1",
        explanation: "Following the order of operations (PEMDAS/GEMDAS), multiply first: (4 × 4) = 16 and (5 × 3) = 15. Then subtract: 16 - 15 = 1."
    },
    {
        text: "[Refer to Box 1] What must be the next number expression to 5×5 - 6×4 in Box 1?",
        options: ["6×6 - 7×5", "6×5 - 7×4", "7×7 - 8×6", "5×6 - 6×7"],
        answer: "6×6 - 7×5",
        explanation: "The pattern increments each number by 1 for every consecutive expression: (n)×(n) - (n+1)×(n-1). Following 5, the next base number is 6."
    },
    {
        text: "[Refer to Box 1] [Refer to eq1] Which of the following algebraic expressions represents the set of number expressions in Box 1?",
        options: ["(n)(n) - (n+3)(n+1)", "(n)(n) - (n+1)(n-1)", "(n-1)(n-1) - n(n-2)", "n² - 3n(1)", "n² - n - 1"],
        answer: "(n)(n) - (n+1)(n-1)",
        explanation: "Each expression takes a number squared (n × n) and subtracts the product of the number after it (n+1) and the number before it (n-1)."
    },
    {
        text: "[Refer to Box 1] [Refer to addimg 1] Which of the following best explains why your chosen expression correctly represents the set of number expressions in Box 1?",
        options: ["The first term is always the square of a number n (n²), subtracts by the product of the number after it (n+1) and the number before it (n-1).", "The first term is a number n multiplied by 2, minus the product of n and n-1.", "The terms are increasing multiples of 2 and 3.", "The difference between consecutive expressions is always 1."],
        answer: "The first term is always the square of a number n (n²), subtracts by the product of the number after it (n+1) and the number before it (n-1).",
        explanation: "This directly describes the structure of the pattern:(n)(n) - (n+1)(n-1) or n² − (n² − 1)."
    },
    {
        text: "[Refer to Box 1] [Refer to addimg 1] What does n represent in your chosen expression?",
        options: ["The final answer of the expression", "The first number in the expression", "The number of terms in the expression", "A random variable"],
        answer: "The first number in the expression",
        explanation: "In the expression (n)(n) - [(n+1)(n-1)], 'n' is the first number that is squared at the beginning of each sequence."
    },
    {
        text: "Which of the following shows that 1024 is a power of 2?",
        options: ["It is divisible by 2.", "It can be written as 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2.", "It is a multiple of 4.", "It ends in an even number."],
        answer: "It can be written as 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2.",
        explanation: "A power of 2 means the number can be expressed exclusively as 2 multiplied by itself a certain number of times. 2¹⁰ = 1024."
    },
    {
        text: "What is the exponential form of 1024?",
        options: ["2⁸", "2⁹", "2¹⁰", "2¹²"],
        answer: "2¹⁰",
        explanation: "Multiplying 2 by itself 10 times gives 1024."
    },
    {
        text: "Which power of 2 meets BOTH of these conditions: The number is a multiple of 16, and it is more than 50 but less than 200?",
        options: ["32", "64", "128", "Both 64 and 128"],
        answer: "Both 64 and 128",
        explanation: "The powers of 2 between 50 and 200 are 64 (2^6) and 128 (2^7). Both 64 and 128 are divisible by 16."
    },
    {
        text: "Is there a number between 0.998 and 0.999?",
        options: ["Yes, for example 0.9985", "Yes, for example 0.9995", "No, they are consecutive decimals", "Yes, for example 0.9975"],
        answer: "Yes, for example 0.9985",
        explanation: "Real numbers are infinitely dense. You can always find a number between two given decimals by adding another decimal place."
    },
    {
        text: "What is the difference when you subtract 0.998 from 0.999?",
        options: ["0.1", "0.01", "0.001", "0.0001"],
        answer: "0.001",
        explanation: "0.999 - 0.998 = 0.001. You are subtracting the thousandths place."
    },
    {
        text: "Is there a fraction that is greater than 3/4 but less than 1?",
        options: ["Yes, for example 4/5", "Yes, for example 2/3", "No, 3/4 is the highest fraction before 1", "Yes, for example 5/8"],
        answer: "Yes, for example 4/5",
        explanation: "3/4 is equivalent to 0.75. 4/5 is equivalent to 0.80, which is greater than 0.75 but less than 1."
    },
    {
        text: "[Refer to Figure 1] Based on the graph in Figure 1, how many students had an overall academic grade below 84?",
        options: ["3", "4", "5", "Cannot be determined without the exact plot points"],
        answer: "5",
        explanation: "By counting the specific data points that fall below the 84-grade mark/line on the y-axis, you find 5 students."
    },
    {
        text: "[Refer to Figure 1] How do you determine students below 84?",
        options: ["Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.", "Counting the data points on the x-axis.", "Looking at the highest grade achieved.", "Averaging all the grades."],
        answer: "Counting the data points that fall below the horizontal line representing a grade of 84 on the y-axis.",
        explanation: "To find students with a grade below a certain threshold, you look at the vertical axis (grades) and count the points strictly below that value."
    },
    {
        text: "[Refer to Figure 1] Which of the following can be a correct interpretation of the data presented in the graph in Figure 1?",
        options: ["As the number of absences increases, the overall academic grade also increases.", "As the number of absences decreases, the overall academic grade increases.", "As the number of absences increases, the overall academic grade decreases.", "As the number of absences decreases, the overall academic grade also decreases."],
        answer: "As the number of absences increases, the overall academic grade decreases.",
        explanation: "Usually, scatter plots of absences vs. grades show a negative correlation/relationship: more absences lead to lower grades."
    },
	{
        text: "Based on the graph in Figure 2, which of the two puroks shows more diversity in monthly family income? Explain or justify your answer.",
        "options": [
            "Purok 1 – The bars in the graph are close together, showing that most families have similar income levels.",
            "Purok 2 – The bars in the graph are spread out, showing that families have very different income levels, from low to high."
        ],
        "answer": "Purok 2 – The bars in the graph are spread out, showing that families have very different income levels, from low to high.",
        "explanation": "In Figure 2, the bars for Purok 2 are more spread out across different income levels. This means that some families earn very little while others earn much more. The wide spread of bars shows that there is a greater variety or diversity in the monthly family income in Purok 2. In contrast, Purok 1’s bars are closer together, meaning most families earn around the same amount. Therefore, Purok 2 shows more diversity in income."
    },
    {
        text: "The average monthly income of the families in Purok 1 and Purok 2 are equal. Should both puroks be given the same amount of financial aid? What information in the graph in Figure 2 did you base your decision on?",
        "options": [
            "Yes, because their averages are equal, so both should get the same amount of aid.",
            "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
            "Yes, because both have similar income distribution.",
            "No, because Purok 1 has higher income diversity."
        ],
        "answer": "No, because Purok 2 has more income variation, meaning some families earn much less than others and need more help.",
        "explanation": "Even though the average income of both puroks is the same, the graph shows that Purok 2 has a wider range of incomes. This means that while some families in Purok 2 earn a lot, others earn very little. The large difference between the highest and lowest incomes shows greater inequality among families in Purok 2. Because of this, some families in Purok 2 may struggle more financially and therefore need more financial aid compared to those in Purok 1, where incomes are more similar."
    },
	{
        text: "[Refer to Table 2] Based on Table 2, how many students participated in the music activity?",
        options: ["18", "31", "49", "60"],
        answer: "49",
        explanation: "You must add the number of students who participated exclusively in music to those who participated in both music and sports."
    },
    {
        text: "[Refer to Table 2] Based on Table 2, how many students did not participate in any of the two activities?",
        options: ["18", "19", "31", "42"],
        answer: "19",
        explanation: "This is the number located in the 'None' or 'Neither' category on a Venn diagram or two-way table."
    },
	{
        "text": "[Refer to Table 2] Based on Table 2, what is the probability of selecting a student who participated in both music and sports activities?",
        "options": [
            "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
            "31/110 – Because 31 students joined both music and sports out of a total of 110 students",
            "42/110 – Because 42 students joined both music and sports out of a total of 110 students",
            "19/110 – Because 19 students joined both music and sports out of a total of 110 students"
        ],
        "answer": "18/110 – Because 18 students joined both music and sports out of a total of 110 students",
        "explanation": "In Table 2, there are 110 students in total. Out of these, 18 students joined both music and sports. To find the probability, we divide the number of students who joined both activities (18) by the total number of students (110). This gives 18/110. This means that if you randomly pick one student, there is a chance of 18 out of 110 that the student joined both music and sports."
    },
    {
        text: "[Refer to Table 2] Which of the following is a question that can be answered using the information in Table 2?",
        options: ["What is the favorite sport of the students?", "How many students participated in sports activity but not in music activity?", "What time did the music activity start?", "How many teachers organized the activities?"],
        answer: "How many students participated in sports activity but not in music activity?",
        explanation: "A two-way table for participation shows numbers of students per category, not qualitative data like time, favorite sports, or teacher count."
    },
    {
        text: "[Refer to Figure 3] What is the position of point F in Figure 3?",
        options: ["Point F is at -500.", "Point F is at -400.", "Point F is at -300.", "Point F is at -200.", "Point F is at 50."],
        answer: "Point F is at -300.",
        explanation: "By counting the intervals from zero on the number line in the negative direction, F lands on -300."
    },
    {
        text: "[Refer to Figure 3] What is the position of point G in Figure 3?",
        options: ["-100", "0", "200", "-200"],
        answer: "0",
        explanation: "G is located 100 units from the left of '100' and the line uses 100-unit interval."
    },
    {
        text: "[Refer to Figure 4] What are the coordinates of Point C in Figure 4?",
        options: ["(-2, 4)", "(2, 0)", "(-2, 0)", "(4, 4)"],
        answer: "(4, 4)",
        explanation: "Point C is located 4 units to the right from the origin and goes up 4 units."
    },
    {
        text: "[Refer to Figure 4] A line is drawn passing through points B and C in Figure 4. Select the ordered pairs that represent the coordinates of points that are also in this line.",
        options: ["(2, 3)", "(3, 2)", "(4, 7)", "(5,6)"],
        answer: ["(3, 2)", "(5,6)"],
        explanation: "Using the slope created by points B and C (rise/run = 4/2 or 2/1), (3, 2) continues that exact linear trajectory (How: add 1 unit in x, add 2 units in y -> (2,0) -> (2+1,0+2) = (3,2) ; (3+1,2+2) = (4,4) which is the coordinates of C ; (4+1,4+2) = (5,6)."
    },
    {
        text: "[Refer to Figure 4] Draw a line through points A and B in Figure 4. Which of the following ordered pairs represent all the points that are on this line?",
        options: ["(x, -2x)", "(x, -2x+1)", "(x, -x)", "(x, -x+1)", "(x, -x+2)"],
        answer: "(x, -x+2)",
        explanation: "The line AB has a slope of -1 (rise/run = 4/-4 or 1/-1 or -1) -> starting from (2,0) you will add 1 unit for every x and 1 unit for every y to the left since it is a negative/decreasing line. This is represented by (x,-x+2)."
    },
    {
        text: "[Refer to Figure 4] In Figure 4, connecting the points A, B and C will form a triangle, called triangle ABC. What is the area of triangle ABC?",
        options: ["4 square units", "8 square units", "12 square units", "16 square units"],
        answer: "12 square units",
        explanation: "Base AC = 6 units. Vertical Height from Base to Point B = 4 units. Area = 1/2 * 6 * 4 = 12 square units."
    },
    {
        text: "[Refer to Figure 4] Suppose point A represents your house, point B represents your school and point C represents the barangay hall. Which is the shorter walk from your house, going to the school or to the barangay hall?",
        options: ["Going to the school", "Going to the barangay hall", "They are the same distance", "Cannot be determined"],
        answer: "Going to the school",
        explanation: "Find each distance using distance formula: A to C = 6 units; A to B = 5.66 units."
    },
    {
        text: "[Refer to Figure 4] Suppose point A represents your house, point B represents your school and point C represents the barangay hall. How will you determine each distance?",
        options: ["Using coordinate distance", "Using area", "Using slope only", "Estimation"],
        answer: "Using coordinate distance",
        explanation: "Distance formula applies; d = squareroot of{(x2 - x1)^2 + (y2 - y1)^2} where x and y values will be the horizontal and vertical distance of the each point."
    },
    {
        text: "If r is an integer, select all possible values that can be represented by 2r-1.",
        options: ["-5", "-27", "46", "99", "-82", "122"],
        answer: ["-5", "-27", "99"],
        explanation: "The expression 2r-1 always produces an odd integer. -5, -27, 99 are odd, whereas 46 and 122 are even."
    },
    {
        text: "At a fruit stand, apples are priced at 3 for Php100. Which of the following expressions can be used to find the amount to be paid (cost) for any number of apples?",
        options: ["cost = 100/3", "cost = 3n/100", "cost = 100n", "cost = (100/3)n"],
        answer: "cost = (100/3)n",
        explanation: "If 3 apples cost 100, one apple costs 100/3. Therefore, 'n' apples cost (100/3) * n, or (100/3)n."
    },
    {
        text: "Given 17 + a = b + 3, which of the following are two possible values for a and b that will make the equation true?",
        options: ["a = 1, b = 15", "a = 2, b = 10", "a = 0, b = 17", "a = 5, b = 5"],
        answer: "a = 1, b = 15",
        explanation: "Simplify the equation: 17 + a = b + 3 translates to b - a = 14. If a = 1, then b must be 15 (since 15 - 1 = 14)."
    },
    {
        text: "Which statement is always true about a and b in the equation 17 + a = b + 3?",
        options: ["a is greater than b.", "The sum of a and b, (a+b) is 20.", "The difference between b and a, (b-a) is 14.", "a and b can take any value."],
        answer: "The difference between b and a, (b-a) is 14.",
        explanation: "By subtracting 'a' from both sides and subtracting '3' from both sides, 17 - 3 = b - a, so 14 = b - a."
    },
    {
        text: "[Refer to addimg 2] What reason can we use to transform equation 1: (5y - 8 = 14 - 3y) into equation 2: (5y + 3y - 8 = 14)?",
        options: ["If we subtract 3y from both sides of equation 1, the equation will remain true.", "If we subtract 8 from both sides of equation 1, the equation will remain true.", "If we add 3y to both sides of equation 1, the equation will remain true.", "If we divide both sides of equation 1 by 8, the equation will remain true."],
        answer: "If we add 3y to both sides of equation 1, the equation will remain true.",
        explanation: "Adding 3y to both sides cancels out the -3y on the right side and moves it to the left side as +3y, utilizing the Addition Property of Equality."
    },
    {
        text: "[Refer to Figure 5] How much does it cost to rent the tricycle for 5 days?",
        options: ["1000", "1250", "1450", "1500"],
        answer: "1250",
        explanation: "Using a linear formula like Cost = 250 + 200(days), Cost = 250 + 200(5) = 250 + 1000 = 1250."
    },
	{
        "text": "What does the number 250 in the formulac = 250 + 200d represent? [Refer to Figure 5]",
        "options": [
            "The daily cost of renting the tricycle – depends on how many days it is rented.",
            "The number of days the tricycle is rented - depends on the daily cost",
            "The fixed cost of renting the tricycle – this is the starting amount you pay even if you don’t rent it for any day.",
            "The total cost of renting for one day – depends on both the fixed cost and the daily cost."
        ],
        "answer": "The fixed cost of renting the tricycle – this is the starting amount you pay even if you don’t rent it for any day.",
        "explanation": "The formula c = 250 + 200d shows how to find the total cost (c) of renting a tricycle. The number 250 is the amount you pay before adding any daily charges. This means that even if you rent the tricycle for 0 days, you still need to pay 250 pesos. It is called the fixed cost because it does not change no matter how many days you rent the tricycle. In the graph, this is shown as the point where the line crosses the y-axis (the starting point)."
    },
    {
        "text": "[Refer to Figure 5] In Figure 5, what does the number 200 in the formula c = 250 + 200d represent?",
        "options": [
            "The fixed cost of renting the tricycle",
            "The daily cost of renting the tricycle or the amount added for each day the tricycle is rented.",
            "The total cost for 5 days of renting the tricycle",
            "The number of days rented"
        ],
        "answer": "The daily cost of renting the tricycle or the amount added for each day the tricycle is rented.",
        "explanation": "In the formula c = 250 + 200d, the number 200 is multiplied by d, which stands for the number of days. This means that for every day you rent the tricycle, you add 200 pesos to the total cost. For example, if you rent it for 1 day, you pay 250 + 200(1) = 450 pesos. If you rent it for 2 days, you pay 250 + 200(2) = 650 pesos. So, 200 represents the daily cost or the rate per day of renting the tricycle."
    },
    {
        "text": "[Refer to Figure 5] What aspect of the graph in Figure 5 represents the 200 in the formula c = 250 + 200d?",
        "options": [
            "x-intercept – this shows when the total cost is zero",
            "y-intercept – this shows the starting cost",
            "Slope – this shows how much the total cost increases for every additional day the tricycle is rented.",
            "Minimum point – this is shows the lowest value"
        ],
        "answer": "Slope – this shows how much the total cost increases for every additional day the tricycle is rented.",
        "explanation": "In the graph of the formula c = 250 + 200d, the line goes upward as the number of days increases. The slope of the line tells us how steep the line is, or how much the total cost changes when the number of days increases by one. Since the slope is 200, it means that for every extra day you rent the tricycle, the total cost increases by 200 pesos. The slope shows the rate of change, which in this case is the daily rental cost."
    },
    {
        text: "[Refer to Figure 6] In Figure 6, if the measure of angle P is 30 degrees (that is, p = 30), which of the following are possible values for q and r? Choose 2 that are correct among the choices.",
        options: ["q = 10 and r = 140", "q = 10 and r = 130", "q = 110 and r = 30", "q = 100 and r = 80", "q = 100 and r = 50"],
        answer: ["q = 10 and r = 140", "q = 100 and r = 50"],
        explanation: "The sum of interior angles in a triangle is 180. If p = 30, then q + r must equal 150. 10 + 140 = 150 ; 100 + 50 = 150"
    },
    {
        text: "[Refer to Figure 6] In Figure 6, if the measure of angle R is 60 degrees (that is, r = 60) and the measure of the exterior angle at Q is 130, what is true about the values of p and q? Choose two correct statements. (NOTE: The exterior angle of a triangle forms a 180-degree angle with the adjacent interior angle.)",
        options: ["The sum of p and q is 130.", "p and q can have several values.", "The value of p is 70 and the value of q is 50.", "The value of p is 50 and the value of q is 70.", "The value of r plus p is 130."],
        answer: ["The value of p is 70 and the value of q is 50.", "The value of r plus p is 130."],
        explanation: "Interior q + exterior Q = 180, so q = 180 - 130 = 50. Then p = 180 - (60 + 50) = 70. ; r = 60, p = 70, q = 50 ; r + p = 130 -> 60 + 70 = 130"
    },
	{
        "text": "[Refer to Figure 6] In Figure 6, which of the following statements about the properties of triangles will help determine the values of p and q in the preceding question? Choose those that are applicable.",
        "options": [
            "Each angle of an equilateral triangle is 60 degrees – this applies only to equilateral triangles, not all triangles.",
            "In an isosceles triangle, the base angles are equal – this helps only if the triangle is isosceles.",
            "The exterior angle and one of the interior angles adjacent to it form a linear pair – this means their measures add up to 180°, which helps find missing angles.",
            "The measure of the exterior angle of a triangle is equal to the sum of the two remote interior angles – this helps find unknown angles using known ones.",
            "There are six exterior angles in any triangle – this is incorrect; there are only three.",
            "The sum of all the exterior angles of a triangle is 360 degrees – true, but not directly useful for finding p and q."
        ],
        "answer": ["The exterior angle and one of the interior angles adjacent to it form a linear pair – this means their measures add up to 180°, which helps find missing angles.", "The measure of the exterior angle of a triangle is equal to the sum of the two remote interior angles – this helps find unknown angles using known ones."],
        "explanation": "These two properties are important when solving for unknown angles in triangles. The first property tells us that an exterior angle and the interior angle next to it always add up to 180°, forming a straight line. The second property tells us that the measure of an exterior angle is equal to the sum of the two opposite (remote) interior angles. By using these two rules, we can find the values of p and q by setting up equations that relate the given angles in the triangle."
    },
    {
        text: "[Refer to Figure 7] What are the lengths of the other two sides of the triangular dog house?",
        options: ["The other two sides are 1.5 meters each.", "The other two sides are 2 meters and 3 meters.", "The other two sides are 3 meters each.", "The other two sides are 4 meters and 6 meters."],
        answer: "The other two sides are 1.5 meters each.",
        explanation: "By applying the ratio from similar figures, if you have one scaled side, you multiply the known sides of the original by the scale factor. How: ratio of the sides = 3:3:2 from longest to shortest. Let x = 2 longer sides and shortest side = 1 meter; x meters : x meters : 1 meter = 3:3:2 -> scale factor of known measure and ratio = shortest side/2 = 1/2 or 0.5 -> 2 longer sides = (3 meters)(0.5) = 1.5 meters ; To check ratio if still correct divide all sides to scale factor (0.5) -> 1.5m/0.5 : 1.5m/0.5 : 1m/0.5 = 3 : 3 : 2"
    },
	{
        "text": "In Figure 7, are the sides of the triangular dog house proportional to the sides of the triangular toy storage?",
        "options": [
            "Yes, they are proportional – because both triangles have sides in the same ratio (3:3:2), meaning their shapes are similar and their sides increase or decrease by the same factor.",
            "No, they are not proportional – because their side ratios are different."
        ],
        "answer": "Yes, they are proportional – because both triangles have sides in the same ratio (3:3:2), meaning their shapes are similar and their sides increase or decrease by the same factor.",
        "explanation": "When two triangles have sides that are in the same ratio, they are called similar triangles. This means their shapes are the same, but their sizes may be different. In Figure 7, the sides of the dog house triangle are in the ratio 3:3:2. The sides of the toy storage triangle also follow the same ratio. Because the ratios are equal, the triangles are proportional. This means that if one triangle is smaller or larger, its sides still keep the same relationship in length."
    },
    {
        "text": "The base of the toy storage measures 25 centimeters. What are the lengths of its other two sides?",
        "options": [
            "The other two sides are 37.5 centimeters each",
            "The other two sides measure 50 and 75 centimeters",
            "The other two sides are 75 centimeters each",
            "The other two sides measure 100 and 150 centimeters"
        ],
        "answer": "The other two sides are 37.5 centimeters each",
        "explanation": "The dog house triangle has sides in the ratio 3:3:2. This means that for every 2 parts of the base, each of the other sides has 3 parts. If the toy storage base is 25 cm, we can find the other sides by comparing the parts. One part equals 25 ÷ 2 = 12.5 cm. Each of the other sides has 3 parts, so 12.5 × 3 = 37.5 cm. Therefore, the other two sides of the toy storage are 37.5 cm each. This keeps the same ratio as the dog house triangle, showing that the triangles are proportional."
    },
    {
        text: "[Refer to Figure 8] What is the area of the sidewalk in square meters surrounding the pool? (Use pi = 3.14)",
        options: ["11.5π", "21π", "34.54", "36.14"],
        answer: "34.54",
        explanation: "The pool diameter is 10 (r = 5). The sidewalk adds 1m uniformly (R = 6). Area = Area(outer) - Area(inner) = π(6²) - π(5²) = 36π - 25π = 11π = 11(3.14) = 34.54 square meters"
    },
    {
        text: "[Refer to Figure 9] Which of the following will give the total volume of water in the pool?",
        options: ["10π(2.1) cubic meters", "25π(2.1) cubic meters", "10π(2.1)/2 cubic meters", "25π(2.1)/2 cubic meters", "100π(2.1)/2 cubic meters"],
        answer: "25π(2.1)/2 cubic meters",
        explanation: "Volume = Base Area × Average Depth. Base Area = π(5²) = 25π. Average Depth = (1.5 + 0.6) / 2 = 2.1 / 2. Volume = 25π(2.1) / 2."
    },
    {
        text: "[Refer to Figure 10] The wheel in Figure 10 is rolled exactly 5 times. Which of the following shows how you can compute the distance travelled by the wheel?",
        options: ["5 × π × 60", "5 × π × 30²", "5 × 60", "5 × π × 30"],
        answer: "5 × π × 60",
        explanation: "Distance traveled is Rotations × Circumference. Circumference = π × diameter. The diameter is 60. So, 5 × (π × 60)."
    },
    {
        text: "[Refer to Figure 10] How many degrees did the wheel’s pin rotate after 5 rolls?",
        options: ["360 degrees", "720 degrees", "1800 degrees", "900 degrees"],
        answer: "1800 degrees",
        explanation: "One full roll (rotation) is 360 degrees. Therefore, 5 full rolls is 5 × 360 = 1800 degrees."
    },
    {
        text: "Which of the following expressions is equivalent to 24?",
        options: ["3 × 4 + 6 × 2", "5 × 5 - 1", "10 × 3 - 2 × 3", "All of the above"],
        answer: "All of the above",
        explanation: "Evaluating each: (12 + 12 = 24), (25 - 1 = 24), and (30 - 6 = 24)."
    },
    {
        text: "If 2⁵ = 32, what is the value of 2⁷?",
        options: ["64", "128", "256", "512"],
        answer: "128",
        explanation: "2⁷ is 2⁵ multiplied by 2 twice more (32 × 2 × 2 = 128)."
    },
    {
        text: "Which of the following statements is true?",
        options: ["0.509 is greater than 0.51", "0.99 is less than 0.989", "0.125 is exactly halfway between 0.12 and 0.13", "0.005 is equal to 1/20"],
        answer: "0.125 is exactly halfway between 0.12 and 0.13",
        explanation: "Adding a zero makes it easier to compare: 0.120 and 0.130. The exact midpoint is 0.125."
    },
    {
        text: "What is the difference when 2.005 is subtracted from 2.010?",
        options: ["0.005", "0.05", "0.5", "0.015"],
        answer: "0.005",
        explanation: "Aligning the decimals: 2.010 - 2.005 = 0.005."
    },
    {
        text: "Which of the following fractions is the largest?",
        options: ["1/2", "3/5", "2/3", "5/8"],
        answer: "2/3",
        explanation: "Converting to decimals or common denominators: 1/2 = 0.5, 3/5 = 0.6, 2/3 ≈ 0.667, 5/8 = 0.625. 2/3 is the largest."
    },
		{
        text: "Evaluate the mathematical expression: 5 × 5 - 4 × 6",
        options: ["1", "4", "6", "24"],
        answer: "1",
        explanation: "Following PEMDAS/BODMAS, multiply first: (5 × 5) - (4 × 6) = 25 - 24 = 1."
    },
    {
        text: "Which of the following numbers is a power of 2 that is greater than 60 but less than 100?",
        options: ["64", "72", "81", "96"],
        answer: "64",
        explanation: "2 to the power of 6 (2^6) is 64, which falls between 60 and 100."
    },
    {
        text: "Which of the following decimals is located strictly between 0.857 and 0.858?",
        options: ["0.8575", "0.8581", "0.8569", "0.8507"],
        answer: "0.8575",
        explanation: "0.8575 is greater than 0.8570 and less than 0.8580."
    },
    {
        text: "Which of the following fractions is greater than 3/4 but less than 1?",
        options: ["2/3", "4/5", "1/2", "5/4"],
        answer: "4/5",
        explanation: "3/4 is 0.75. 4/5 is 0.80, which is between 0.75 and 1.0."
    },
    {
        "text": "What is the correct value of the expression 20 - 4 × 3 + 2?",
        "options": [
            "50 because you subtract 4 from 20 first, multiply by 3, then add 2.",
            "10 because you multiply 4 by 3 first to get 12, subtract it from 20 to get 8, then add 2.",
            "0 because you multiply 4 and 3 to get 12, add 2 to get 14, and subtract from 20.",
            "-4 because you add 3 and 2 first, multiply by 4, and subtract from 20."
        ],
        "answer": "10 because you multiply 4 by 3 first to get 12, subtract it from 20 to get 8, then add 2.",
        "explanation": "Following the order of operations (PEMDAS/GEMDAS), multiplication must be performed before addition and subtraction. Then, addition and subtraction are done from left to right."
    },
    {
        "text": "If you evaluate the expression 4^3, which of the following describes the correct process and result?",
        "options": [
            "12 because you simply multiply the base 4 by the exponent 3.",
            "64 because you multiply the base 4 by itself three times: 4 × 4 × 4.",
            "81 because you multiply the exponent 3 by itself four times: 3 × 3 × 3 × 3.",
            "16 because you square the number 4."
        ],
        "answer": "64 because you multiply the base 4 by itself three times: 4 × 4 × 4.",
        "explanation": "An exponent indicates how many times the base number is used as a factor."
    },
    {
        "text": "Which of the following best explains if there is a number between 2.45 and 2.46?",
        "options": [
            "No, because 46 is the immediate next whole number after 45.",
            "Yes, for example 2.455, because you can always add another decimal place to find a value in between.",
            "No, because decimals only go up to two places in standard counting.",
            "Yes, for example 2.47, because it is greater than 2.45."
        ],
        "answer": "Yes, for example 2.455, because you can always add another decimal place to find a value in between.",
        "explanation": "Real numbers and decimals are infinitely dense; you can always find a midpoint by extending the decimal places."
    },
    {
        "text": "What happens when you subtract 0.09 from 0.1?",
        "options": [
            "0.01 because 0.1 is equivalent to 0.10, and 0.10 minus 0.09 is 0.01.",
            "0.91 because you bring down the 9 and subtract 0 from 1.",
            "0.001 because you are subtracting in the thousandths place.",
            "-0.08 because 9 is larger than 1."
        ],
        "answer": "0.01 because 0.1 is equivalent to 0.10, and 0.10 minus 0.09 is 0.01.",
        "explanation": "Aligning the decimal points and adding placeholder zeros (0.10 - 0.09) makes the subtraction clear."
    },
    {
        "text": "Look at the pattern: 1st = (2^2 - 2), 2nd = (3^2 - 3), 3rd = (4^2 - 4). What will be the value of the 5th",
        "options": [
            "16 because the 5th base number is 5, and 5 squared minus 5 is 20.",
            "20 because the 5th expression uses the number 6 (since the 1st is 2), and 6^2 - 6 = 30.",
            "30 because the sequence of base numbers is 2, 3, 4, 5, 6, making the 5th expression 6^2 - 6.",
            "25 because you just square the 5th number."
        ],
        "answer": "30 because the sequence of base numbers is 2, 3, 4, 5, 6, making the 5th expression 6^2 - 6.",
        "explanation": "The pattern uses n^2 - n. If term 1 uses n=2, term 2 uses n=3, term 3 uses n=4, term 4 uses n=5, and term 5 uses n=6. (6 × 6) - 6 = 30."
    },
	    {
        text: "A graph shows the relationship between days absent and final grades. As the days absent increase, the final grades decrease. What kind of correlation is this?",
        options: ["Positive correlation", "Negative correlation", "No correlation", "Constant correlation"],
        answer: "Negative correlation",
        explanation: "A negative correlation occurs when one variable increases while the other decreases."
    },
    {
        text: "In a survey of 100 students, 60 like math, 50 like science, and 20 like both. How many students like math but NOT science?",
        options: ["10", "20", "30", "40"],
        answer: "40",
        explanation: "Subtract the intersection (both) from the total who like math: 60 - 20 = 40."
    },	
    {
        text: "In a survey of 100 students, 60 like math, 50 like science, and 20 like both. How many students do NOT like either math or science?",
        options: ["10", "20", "30", "40"],
        answer: "10",
        explanation: "Total liking at least one is (Math only) + (Science only) + (Both) = 40 + 30 + 20 = 90. 100 - 90 = 10."
    },
    {
        text: "A graph shows an upward trend from left to right regarding study hours and test scores. What is the correct interpretation?",
        options: ["As study hours increase, test scores decrease.", "As study hours increase, test scores also increase.", "Study hours have no effect on test scores.", "As study hours decrease, test scores increase."],
        answer: "As study hours increase, test scores also increase.",
        explanation: "An upward trend indicates a positive correlation where both variables increase together."
    },
    {
        text: "In a class, 30 joined Math Club, 15 joined Science Club, and 5 joined both. How many joined Math Club ONLY?",
        options: ["30", "25", "15", "10"],
        answer: "25",
        explanation: "Subtract the students who joined both from the total Math Club members: 30 - 5 = 25."
    },	
    {
        "text": " A graph shows that as the number of hours spent practicing basketball increases, the number of successful free throws also increases. How do we interpret this?",
        "options": [
            "It is a negative correlation because playing more makes you tired, causing you to miss.",
            "It is a positive correlation because both the practice hours and the successful free throws are going up together.",
            "It has no correlation because practice does not guarantee a perfect score.",
            "It is a constant trend because the number of free throws stays the same."
        ],
        "answer": "It is a positive correlation because both the practice hours and the successful free throws are going up together.",
        "explanation": "A positive correlation occurs when two variables increase simultaneously."
    },
    {
        "text": "In a survey table of 50 students, 30 like Math, 25 like Science, and 10 like BOTH. How many students like Math but NOT Science?",
        "options": [
            "30 because the table says 30 students like Math.",
            "20 because you must subtract the 10 students who also like Science from the 30 who like Math.",
            "15 because you subtract 10 from 25.",
            "5 because you subtract 25 from 30."
        ],
        "answer": "20 because you must subtract the 10 students who also like Science from the 30 who like Math.",
        "explanation": "To find those who exclusively like Math, subtract the intersection (both) from the total Math group (30 - 10 = 20)."
    },
    {
        "text": "Using the same survey (30 like Math, 25 Science, 10 both out of 50 students), how many students do NOT like either of the two subjects?",
        "options": [
            "5 because the total who like at least one subject is 45 (20 Math only + 15 Science only + 10 both), leaving 5 out of 50.",
            "10 because you subtract 30 and 25 from 50.",
            "0 because everyone must like at least one subject.",
            "15 because you subtract 35 from 50."
        ],
        "answer": "5 because the total who like at least one subject is 45 (20 Math only + 15 Science only + 10 both), leaving 5 out of 50.",
        "explanation": "Using the union of sets: Total = (Math only) + (Science only) + (Both) + (Neither). 50 = 20 + 15 + 10 + Neither. Neither = 5."
    },
    {
        "text": "If a line graph shows a company's sales going down steadily from January to June, what prediction can be made for July if the trend continues?",
        "options": [
            "Sales will spike up because a new month starts the cycle over.",
            "Sales will be lower than June's sales because the downward line shows a continuous decrease.",
            "Sales will be exactly the same as January.",
            "It cannot be determined because graphs cannot predict the future."
        ],
        "answer": "Sales will be lower than June's sales because the downward line shows a continuous decrease.",
        "explanation": "Trend analysis assumes that if external factors remain the same, an established continuous pattern will persist in the immediate future."
    },
    {
        "text": "Which of the following questions CANNOT be answered by looking at a pie chart showing the percentage of students' favorite colors?",
        "options": [
            "What is the most popular color among the students?",
            "What fraction of the students like Blue?",
            "How many specific students are there in the entire school?",
            "Which color is the least liked by the group?"
        ],
        "answer": "How many specific students are there in the entire school?",
        "explanation": "A pie chart showing only percentages does not provide the raw total population number unless it is explicitly labeled."
    },
	{
        "text": "A bar graph shows the number of fruits sold by two vendors in one week. Vendor A’s bars are close in height, while Vendor B’s bars vary greatly. Which vendor shows more variation in sales?",
        "options": [
            "Vendor A – Because the bars are close together, showing similar sales each day.",
            "Vendor B – Because the bars are spread out, showing that some days had very high sales while others had very low sales."
        ],
        "answer": "Vendor B – Because the bars are spread out, showing that some days had very high sales while others had very low sales.",
        "explanation": "In a bar graph, the height of each bar represents the amount sold. When the bars are spread out, it means the sales numbers are very different from day to day. Vendor B’s graph shows this pattern, meaning their sales were not consistent. Some days they sold a lot, and other days they sold very little. This wide difference shows greater variation in sales compared to Vendor A, whose bars are close in height, meaning their daily sales were almost the same."
    },
    {
        "text": "A graph shows the monthly water consumption of two households. Household X’s bars are almost the same height, while Household Y’s bars go up and down. Which household has more consistent water use?",
        "options": [
            "Household X – Because the bars are nearly equal, showing that they use about the same amount of water each month.",
            "Household Y – Because the bars are uneven, showing big changes in water use."
        ],
        "answer": "Household X – Because the bars are nearly equal, showing that they use about the same amount of water each month.",
        "explanation": "When the bars in a graph are almost the same height, it means the values are close to each other. Household X’s bars show that their water use doesn’t change much from month to month. Household Y’s bars, however, go up and down, meaning their water use changes a lot. So, Household X has more consistent water consumption."
    },
    {
        "text": "A bar graph shows the weekly test scores of two students, Ana and Ben. Ana’s bars are close together, while Ben’s bars vary widely. Who has more consistent performance?",
        "options": [
            "Ana – Because her scores are close together, showing she performs at about the same level each week.",
            "Ben – Because his scores go up and down, showing big changes in performance."
        ],
        "answer": "Ana – Because her scores are close together, showing she performs at about the same level each week.",
        "explanation": "In a bar graph, bars that are close in height mean the scores are similar. Ana’s bars show that her test scores don’t change much from week to week, meaning she performs consistently. Ben’s bars vary a lot, showing that sometimes he scores high and other times low. This means Ana’s performance is steadier."
    },
    {
        "text": "A box contains 20 red balls, 10 blue balls, and 5 green balls. What is the probability of picking a blue ball?",
        "options": [
            "10/35 – Because there are 10 blue balls out of 35 total balls.",
            "5/35 – Because there are 5 green balls.",
            "20/35 – Because there are 20 red balls.",
            "15/35 – Because there are 15 non-blue balls."
        ],
        "answer": "10/35 – Because there are 10 blue balls out of 35 total balls.",
        "explanation": "Probability is found by dividing the number of desired outcomes by the total number of possible outcomes. Here, the desired outcome is picking a blue ball. There are 10 blue balls and 35 total balls (20 + 10 + 5). So, the probability is 10 ÷ 35 = 10/35. This means that if you pick one ball at random, there are 10 chances out of 35 that it will be blue."
    },
    {
        "text": "In a class of 40 students, 12 joined the art club, 8 joined the music club, and 5 joined both. What is the probability of selecting a student who joined both clubs?",
        "options": [
            "5/40 – Because 5 students joined both clubs out of 40 total students.",
            "12/40 – Because 12 joined the art club.",
            "8/40 – Because 8 joined the music club.",
            "20/40 – Because 20 joined at least one club."
        ],
        "answer": "5/40 – Because 5 students joined both clubs out of 40 total students.",
        "explanation": "To find the probability, divide the number of students who joined both clubs by the total number of students. There are 5 students who joined both and 40 students in total. So, 5 ÷ 40 = 5/40. This means that if you randomly pick one student, there’s a 5 out of 40 chance that they joined both clubs."
    },
    {
        "text": "A spinner has 8 equal sections labeled 1 to 8. What is the probability of landing on an even number?",
        "options": [
            "4/8 – Because there are 4 even numbers (2, 4, 6, 8) out of 8 total sections.",
            "2/8 – Because there are 2 odd numbers.",
            "8/8 – Because all numbers are even.",
            "1/8 – Because only one number is even."
        ],
        "answer": "4/8 – Because there are 4 even numbers (2, 4, 6, 8) out of 8 total sections.",
        "explanation": "Probability compares the number of favorable outcomes to the total number of possible outcomes. The even numbers are 2, 4, 6, and 8 — that’s 4 even numbers out of 8 total. So, the probability is 4 ÷ 8 = 4/8. This means there’s a 50% chance of landing on an even number."
    },
    {
        text: "On a number line, Point A is at -45 and Point B is at 15. What is the total distance between the two points?",
        options: ["30 units", "45 units", "60 units", "75 units"],
        answer: "60 units",
        explanation: "Distance is the absolute difference: |15 - (-45)| = |15 + 45| = 60 units."
    },
    {
        text: "In which quadrant of the Cartesian plane does the ordered pair (-5, 7) lie?",
        options: ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV"],
        answer: "Quadrant II",
        explanation: "A negative x-coordinate and a positive y-coordinate place the point in Quadrant II."
    },
    {
        text: "A line passes through the points (0, 1) and (1, 3). Which of the following ordered pairs also lies on this line?",
        options: ["(2, 4)", "(2, 5)", "(3, 6)", "(3, 9)"],
        answer: "(2, 5)",
        explanation: "The slope is (3-1)/(1-0) = 2. The y-intercept is 1. The equation is y = 2x + 1. If x=2, y=5."
    },
    {
        text: "A triangle is plotted on a coordinate plane with vertices at (0,0), (0,6), and (5,0). What is the area of the triangle?",
        options: ["11 square units", "15 square units", "30 square units", "60 square units"],
        answer: "15 square units",
        explanation: "Base is 5, height is 6. Area = 1/2 × base × height = 1/2 × 5 × 6 = 15."
    },
    {
        text: "Point P is at (2, 2) and Point Q is at (2, 8). How long is the line segment connecting P and Q?",
        options: ["4 units", "6 units", "8 units", "10 units"],
        answer: "6 units",
        explanation: "Since the x-coordinates are the same, subtract the y-coordinates: |8 - 2| = 6 units."
    },
    {
        text: "If Point A is at -150 and Point B is at -50 on a number line, what number is exactly halfway between them?",
        options: ["-200", "-100", "0", "100"],
        answer: "-100",
        explanation: "The average of the two points: (-150 + -50) / 2 = -200 / 2 = -100."
    },
    {
        text: "What are the coordinates of a point that is 4 units left of the y-axis and 3 units below the x-axis?",
        options: ["(4, 3)", "(-4, 3)", "(-4, -3)", "(4, -3)"],
        answer: "(-4, -3)",
        explanation: "Left of the y-axis means negative x (-4); below the x-axis means negative y (-3)."
    },
    {
        text: "A line passes through (0,0) and (2,4). Which of the following points also lies on this line?",
        options: ["(3, 5)", "(4, 8)", "(5, 9)", "(6, 10)"],
        answer: "(4, 8)",
        explanation: "The relationship is y = 2x. For x=4, y must be 2(4) = 8."
    },
    {
        text: "A triangle is formed by points A(0,0), B(0,4), and C(3,0). What is the area?",
        options: ["6 square units", "7 square units", "12 square units", "14 square units"],
        answer: "6 square units",
        explanation: "Area = (base × height) / 2. Here, (3 × 4) / 2 = 6."
    },	
    {
        "text": " If Point P is located at (-3, 4), what quadrant is it in and why?",
        "options": [
            "Quadrant I because all numbers are positive.",
            "Quadrant II because the x-coordinate is negative (left) and the y-coordinate is positive (up).",
            "Quadrant III because both coordinates are negative.",
            "Quadrant IV because the x-coordinate is positive and the y-coordinate is negative."
        ],
        "answer": "Quadrant II because the x-coordinate is negative (left) and the y-coordinate is positive (up).",
        "explanation": "The Cartesian plane is divided into 4 quadrants. QII contains (-x, +y) values."
    },
    {
        "text": "Point A is at (1, 2). If you translate (move) this point 4 units to the right and 3 units down, what is the new location?",
        "options": [
            "(5, 5) because you add 4 to x and add 3 to y.",
            "(-3, 5) because moving right makes x negative.",
            "(5, -1) because moving 4 right adds 4 to the x-value (1+4=5), and moving 3 down subtracts 3 from the y-value (2-3=-1).",
            "(4, -3) because those are the translation numbers."
        ],
        "answer": "(5, -1) because moving 4 right adds 4 to the x-value (1+4=5), and moving 3 down subtracts 3 from the y-value (2-3=-1).",
        "explanation": "Translation on the x-axis means Right is (+) and Left is (-). On the y-axis, Up is (+) and Down is (-)."
    },
    {
        "text": "On a number line, a frog jumps from -8 to 5. What is the total distance covered by the frog?",
        "options": [
            "-3 units because you add -8 and 5.",
            "13 units because from -8 to 0 is 8 units, and from 0 to 5 is 5 units, totaling 13.",
            "3 units because 8 minus 5 is 3.",
            "8 units because that is the starting point."
        ],
        "answer": "13 units because from -8 to 0 is 8 units, and from 0 to 5 is 5 units, totaling 13.",
        "explanation": "Distance is absolute value. $|5 - (-8)| = |5 + 8| = 13 units."
    },
    {
        "text": "A square has vertices at (0,0), (0,3), (3,3), and (x,y). What must be the coordinates of (x,y) to complete the square?",
        "options": [
            "(3,0) because it aligns horizontally with (0,0) and vertically with (3,3) to form a 3x3 square.",
            "(0,-3) because you need to go down to make a square.",
            "(3,6) because you multiply the coordinates by 2.",
            "(-3,3) because squares must cross the y-axis."
        ],
        "answer": "(3,0) because it aligns horizontally with (0,0) and vertically with (3,3) to form a 3x3 square.",
        "explanation": "To close the shape with equal sides of 3 units and right angles, the 4th corner must share the x-coordinate of (3,3) and the y-coordinate of (0,0)."
    },
    {
        "text": "If a line passes through the origin (0,0) and the point (2,4), which of the following statements is true about its slope?",
        "options": [
            "The slope is 1/2 because you divide x by y.",
            "The slope is 2 because for every 1 unit you move to the right (run), you move 2 units up (rise): 4/2 = 2/1 or 2.",
            "The slope is 0 because it starts at the origin.",
            "The slope is 4 because that is the highest y-value."
        ],
        "answer": "The slope is 2 because for every 1 unit you move to the right (run), you move 2 units up (rise): 4/2 = 2/1 or 2.",
        "explanation": "Slope = (4 - 0)/(2 - 0) = 4/2 = 2/1 or 2."
    },
    {
        text: "In Triangle XYZ, Angle X is 35 degrees and Angle Y is 55 degrees. What type of triangle is this based on its angles?",
        options: ["Acute triangle", "Right triangle", "Obtuse triangle", "Equilateral triangle"],
        answer: "Right triangle",
        explanation: "The sum of angles in a triangle is 180. 180 - (35 + 55) = 180 - 90 = 90 degrees. A 90-degree angle makes it a right triangle."
    },
    {
        text: "[Refer to Figure 6] The exterior angle P of a triangle measures 145 degrees. Which of the following CANNOT be the measure of one of its opposite interior angles r and q?",
        options: ["45 degrees", "60 degrees", "85 degrees", "150 degrees"],
        answer: "150 degrees",
        explanation: "The sum of the two opposite interior angles must equal the exterior angle (145). Neither angle can be larger than 145."
    },
    {
        text: "A triangular garden has side lengths in a ratio of 3:4:5. If the perimeter of the garden is 60 meters, what is the length of the longest side?",
        options: ["15 meters", "20 meters", "25 meters", "30 meters"],
        answer: "25 meters",
        explanation: "Let sides be 3x, 4x, 5x. 3x + 4x + 5x = 12x = 60, so x = 5. The longest side is 5(5) = 25 meters."
    },
    {
        text: "Two interior angles of a triangle are 45° and 65°. What is the measure of the third angle?",
        options: ["70°", "80°", "90°", "110°"],
        answer: "70°",
        explanation: "The sum of angles in a triangle is 180°. 180 - (45 + 65) = 180 - 110 = 70°."
    },
    {
        text: "An exterior angle measures 120°. If one opposite interior angle is 50°, what is the other?",
        options: ["60°", "70°", "80°", "130°"],
        answer: "70°",
        explanation: "The exterior angle equals the sum of the two opposite interior angles: 120 = 50 + x, so x = 70°."
    },
    {
        "text": " A student has sticks measuring 3 cm, 4 cm, and 10 cm. Can they form a triangle?",
        "options": [
            "Yes, because any three lengths can form a triangle.",
            "No, because the sum of the two shorter sides (3 + 4 = 7) is less than the longest side (10), so they will not meet.",
            "Yes, because 3, 4, and 10 are all whole numbers.",
            "No, because a triangle must always have equal sides."
        ],
        "answer": "No, because the sum of the two shorter sides (3 + 4 = 7) is less than the longest side (10), so they will not meet.",
        "explanation": "The Triangle Inequality Theorem states that the sum of the lengths of any two sides of a triangle must be greater than the length of the third side."
    },
    {
        "text": "In a right-angled triangle, if one of the acute angles measures 35 degrees, what is the measure of the other acute angle?",
        "options": [
            "35 degrees because acute angles in a right triangle are always equal.",
            "55 degrees because the sum of all angles is 180, and 180 - 90 (right angle) - 35 = 55.",
            "145 degrees because 180 - 35 = 145.",
            "45 degrees because it is a standard angle."
        ],
        "answer": "55 degrees because the sum of all angles is 180, and 180 - 90 (right angle) - 35 = 55.",
        "explanation": "A right triangle already accounts for 90°. The remaining two acute angles must be complementary (sum up to 90°). 90 - 35 = 55."
    },
    {
        "text": "Triangle A has sides 3, 4, 5. Triangle B has sides 6, 8, 10. What can be said about these two triangles?",
        "options": [
            "They are completely different and unrelated.",
            "Triangle B is a similar triangle to Triangle A because all of its sides are exactly twice the length of Triangle A's sides (scale factor of 2).",
            "They have the exact same area.",
            "They cannot both be right triangles."
        ],
        "answer": "Triangle B is a similar triangle to Triangle A because all of its sides are exactly twice the length of Triangle A's sides (scale factor of 2).",
        "explanation": "If corresponding sides of two triangles are in the same proportional ratio (3:6 = 4:8 = 5:10), the triangles are similar by SSS similarity."
    },
    {
        "text": " The exterior angle of a triangle measures 120°. If one of the opposite interior angles is 50°, what is the measure of the other opposite interior angle?",
        "options": [
            "70° because the exterior angle of a triangle is equal to the sum of the two opposite interior angles (120 - 50 = 70).",
            "60° because angles on a straight line add up to 180°.",
            "130° because 180 - 50 = 130.",
            "120° because opposite angles are equal."
        ],
        "answer": "70° because the exterior angle of a triangle is equal to the sum of the two opposite interior angles (120 - 50 = 70).",
        "explanation": "The Exterior Angle Theorem states that the measure of an exterior angle is equal to the sum of the measures of its two remote interior angles."
    },
    {
        "text": "What is the area of a triangular flag with a base of 8 meters and a height of 5 meters?",
        "options": [
            "40 square meters because you multiply base by height.",
            "20 square meters because the area of a triangle is half of its base times its height (1/2 × 8 × 5 = 20).",
            "13 square meters because you add the base and height.",
            "26 square meters because you multiply the sum by 2."
        ],
        "answer": "20 square meters because the area of a triangle is half of its base times its height (1/2 × 8 × 5 = 20).",
        "explanation": "Formula for the area of a triangle is A = (1/2) × b × h. So, (1/2) × 8 × 5 = (1/2) × 40 = 20."
    },
	{
        "text": "A triangle has one interior angle of 75°. What is the measure of its adjacent exterior angle?",
        "options": [
            "105°, because interior and exterior angles form a straight line that adds up to 180°.",
            "75°, because they are equal.",
            "90°, because it’s a right triangle.",
            "180°, because that’s the total of all angles."
        ],
        "answer": "105°, because interior and exterior angles form a straight line that adds up to 180°.",
        "explanation": "The interior and exterior angles next to each other form a linear pair, meaning they add up to 180°. So, 180° - 75° = 105°. The exterior angle is 105°."
    },
    {
        "text": "If one exterior angle of a triangle is 120° and one remote interior angle is 50°, what is the other remote interior angle?",
        "options": [
            "70°, because 120° = 50° + the other angle, so the other angle is 70°.",
            "60°, because 120° - 60° = 60°.",
            "80°, because 50° + 80° = 130°.",
            "90°, because 50° + 90° = 140°."
        ],
        "answer": "70°, because 120° = 50° + the other angle, so the other angle is 70°.",
        "explanation": "The exterior angle equals the sum of the two remote interior angles. So, 120° = 50° + x → x = 70°. This means the other remote interior angle measures 70°."
    },
    {
        "text": "A model of a building is made using a scale of 1 cm = 5 m. If the real building is 20 m tall, how tall is the model?",
        "options": [
            "4 cm, because 20 ÷ 5 = 4.",
            "5 cm, because 1 cm = 5 m.",
            "10 cm, because 20 ÷ 2 = 10.",
            "25 cm, because 20 + 5 = 25."
        ],
        "answer": "4 cm, because 20 ÷ 5 = 4.",
        "explanation": "The scale means 1 cm in the model equals 5 m in real life. To find the model’s height, divide the real height by the scale factor: 20 ÷ 5 = 4 cm. So, the model is 4 cm tall."
    },
    {
        "text": "Two similar triangles have sides in the ratio 2:3. If the smaller triangle’s side is 8 cm, what is the corresponding side in the larger triangle?",
        "options": [
            "12 cm, because 8 × (3 ÷ 2) = 12.",
            "10 cm, because 8 + 2 = 10.",
            "16 cm, because 8 × 2 = 16.",
            "6 cm, because 8 ÷ 2 = 4."
        ],
        "answer": "12 cm, because 8 × (3 ÷ 2) = 12.",
        "explanation": "The ratio 2:3 means the larger triangle’s sides are 1.5 times longer than the smaller one. Multiply 8 by (3 ÷ 2) = 1.5 → 8 × 1.5 = 12 cm. So, the corresponding side in the larger triangle is 12 cm."
    },
    {
        "text": "A map uses a scale of 1 cm = 4 km. If two towns are 6 cm apart on the map, how far apart are they in real life?",
        "options": [
            "24 km, because 6 × 4 = 24.",
            "10 km, because 6 + 4 = 10.",
            "12 km, because 6 × 2 = 12.",
            "4 km, because 1 cm = 4 km."
        ],
        "answer": "24 km, because 6 × 4 = 24.",
        "explanation": "The scale shows that each centimeter on the map represents 4 km in real life. Multiply the map distance by the scale factor: 6 × 4 = 24 km. So, the towns are 24 km apart in reality."
    },
    {
        "text": "A toy car is built at a scale of 1:10. If the real car is 3 meters long, how long is the toy car?",
        "options": [
            "0.3 meters, because 3 ÷ 10 = 0.3.",
            "3 meters, because the scale is 1:1.",
            "30 meters, because 3 × 10 = 30.",
            "1 meter, because 3 ÷ 3 = 1."
        ],
        "answer": "0.3 meters, because 3 ÷ 10 = 0.3.",
        "explanation": "The scale 1:10 means the toy car is 10 times smaller than the real car. Divide the real length by 10: 3 ÷ 10 = 0.3 meters. So, the toy car is 0.3 meters long."
    },
    {
        "text": "A rectangular garden model has a length of 5 cm and width of 3 cm. The real garden is 20 m long. What is its real width?",
        "options": [
            "12 m, because the scale factor is 20 ÷ 5 = 4, and 3 × 4 = 12.",
            "10 m, because 5 + 5 = 10.",
            "15 m, because 3 × 5 = 15.",
            "8 m, because 20 ÷ 2.5 = 8."
        ],
        "answer": "12 m, because the scale factor is 20 ÷ 5 = 4, and 3 × 4 = 12.",
        "explanation": "The scale factor is found by dividing the real length by the model length: 20 ÷ 5 = 4. Multiply the model width by the same factor: 3 × 4 = 12. So, the real garden’s width is 12 meters, keeping the same proportions as the model."
    },
    {
        text: "If n represents a whole number, which expression represents the product of a number and two less than that number?",
        options: ["n(2 - n)", "n(n - 2)", "2n - 2", "n - 2n"],
        answer: "n(n - 2)",
        explanation: "The number is 'n', and two less than the number is 'n - 2'. Their product is n(n - 2)."
    },
    {
        text: "What is the value of x² - 3x when x = 4?",
        options: ["1", "4", "10", "16"],
        answer: "4",
        explanation: "Substitute 4 for x: (4)² - 3(4) = 16 - 12 = 4."
    },
    {
        text: "If k is an integer, which of the following expressions will ALWAYS result in an even number?",
        options: ["k + 1", "2k", "2k - 1", "k²"],
        answer: "2k",
        explanation: "Multiplying any integer by 2 guarantees the result is a multiple of 2, making it an even number."
    },
	{
        text: "Which of the following algebraic expressions represents the product of a number and the number succeeding it?",
        options: ["n + (n+1)", "n(n+1)", "n² + 1", "2n + 1"],
        answer: "n(n+1)",
        explanation: "Product implies multiplication. If a number is 'n', the succeeding number is 'n+1', so their product is n(n+1)."
    },
	{
        text: "If k is an integer, what kind of number will the expression 2k + 1 ALWAYS produce?",
        options: ["A positive number", "A negative number", "An even number", "An odd number"],
        answer: "An odd number",
        explanation: "2k is always even for any integer k; adding 1 to an even number always results in an odd number."
    },
    {
        "text": "If 'x' represents a student's age now, which expression correctly represents the student's age 5 years ago?",
        "options": [
            "x + 5 because 'ago' means you are looking for a bigger number.",
            "5x because you multiply their age by 5.",
            "x - 5 because you subtract 5 from their current age to find how old they were in the past.",
            "5 - x because you take their age away from 5."
        ],
        "answer": "x - 5 because you subtract 5 from their current age to find how old they were in the past.",
        "explanation": "The phrase 'years ago' translates mathematically to subtraction from the current variable."
    },
    {
        "text": "Why does the expression 2n represent an even number, assuming n is any whole number?",
        "options": [
            "Because 'n' is an abbreviation for 'even'.",
            "Because any whole number multiplied by 2 will always be perfectly divisible by 2, which is the definition of an even number.",
            "Because adding 2 to any number makes it even.",
            "It does not; 2n can sometimes be an odd number."
        ],
        "answer": "Because any whole number multiplied by 2 will always be perfectly divisible by 2, which is the definition of an even number.",
        "explanation": "Multiples of 2 (2, 4, 6, 8...) are even integers by mathematical definition."
    },
    {
        "text": "A taxi charges a flat rate of Php 40 plus Php 15 per kilometer traveled (k). Which expression shows the total fare?",
        "options": [
            "40k + 15 because the 40 is attached to the kilometers.",
            "55k because you combine 40 and 15.",
            "40 + 15k because the flat rate is paid once, and the Php 15 is multiplied by the number of kilometers (k).",
            "k(40 + 15) because both are multiplied by distance."
        ],
        "answer": "40 + 15k because the flat rate is paid once, and the Php 15 is multiplied by the number of kilometers (k).",
        "explanation": "The constant (40) does not change, while the variable cost (15) changes depending on 'k' (kilometers)."
    },
    {
        "text": "If n, n+1, and n+2 represent three consecutive integers, and n = 10, what are the numbers?",
        "options": [
            "10, 11, 12 because you substitute 10 into each expression: 10, 10+1, 10+2.",
            "10, 20, 30 because you multiply by 1 and 2.",
            "10, 9, 8 because consecutive means going backward.",
            "1, 2, 3 because 'n' always equals 1."
        ],
        "answer": "10, 11, 12 because you substitute 10 into each expression: 10, 10+1, 10+2.",
        "explanation": "Consecutive integers follow each other in order, increasing by exactly 1 each time."
    },
    {
        "text": "What does the expression 3(x + 4) mean in relation to the distributive property?",
        "options": [
            "It means you only multiply 3 by x, resulting in 3x + 4.",
            "It means you add 3, x, and 4 together.",
            "It means you multiply 3 by both terms inside the parenthesis, resulting in 3x + 12.",
            "It means you multiply x by 4 and then add 3."
        ],
        "answer": "It means you multiply 3 by both terms inside the parenthesis, resulting in 3x + 12.",
        "explanation": "The distributive property rule is a(b + c) = ab + ac. Therefore, 3(x) + 3(4) = 3x + 12."
    },
    {
        text: "Given the equation 20 + a = b + 8. If a = 5, what must be the value of b?",
        options: ["13", "17", "25", "33"],
        answer: "17",
        explanation: "Substitute a = 5: 20 + 5 = b + 8 -> 25 = b + 8. Subtracting 8 from 25 gives b = 17."
    },
    {
        text: "What is the value of y in the equation 3y - 4 = 11?",
        options: ["3", "4", "5", "15"],
        answer: "5",
        explanation: "Add 4 to both sides: 3y = 15. Then divide by 3 to get y = 5."
    },
    {
        text: "If you have the equation 4x = 20, what mathematical operation justifies transforming it to x = 5?",
        options: ["Adding 4 to both sides", "Subtracting 4 from both sides", "Multiplying both sides by 4", "Dividing both sides by 4"],
        answer: "Dividing both sides by 4",
        explanation: "By the Division Property of Equality, dividing both sides by the coefficient 4 isolates x."
    },
    {
        text: "Given 15 + x = y + 5. If x = 2, what must be the value of y?",
        options: ["10", "12", "17", "20"],
        answer: "12",
        explanation: "Substitute x: 15 + 2 = y + 5 -> 17 = y + 5. Subtracting 5 from both sides gives y = 12."
    },
    {
        text: "What is the value of m in the equation: 4m - 7 = 2m + 9?",
        options: ["2", "4", "8", "16"],
        answer: "8",
        explanation: "Subtract 2m from both sides: 2m - 7 = 9. Add 7 to both sides: 2m = 16. Divide by 2: m = 8."
    },
    {
        text: "A bakery sells cupcakes at 6 for Php 150. Which expression shows the cost (C) of y cupcakes?",
        options: ["C = 25y", "C = 150y", "C = 150/y", "C = 6y + 150"],
        answer: "C = 25y",
        explanation: "The unit price is 150 ÷ 6 = Php 25 per cupcake. Therefore, y cupcakes cost 25y."
    },
    {
        text: "Notebooks are priced at 4 for Php 120. Which equation finds the cost (C) for n notebooks?",
        options: ["C = 120/4n", "C = 30n", "C = 120n", "C = 4n + 120"],
        answer: "C = 30n",
        explanation: "The price per notebook is 120 / 4 = 30. Therefore, the cost is 30 times the number of notebooks (n)."
    },
    {
        "text": "To solve the equation 4y = 20, why do we divide both sides by 4?",
        "options": [
            "Because dividing by 4 is the inverse operation of multiplying by 4, which isolates the variable 'y' by itself.",
            "Because 20 divided by 4 is a nice whole number.",
            "Because you always divide by the larger number.",
            "We shouldn't divide; we should subtract 4 from both sides."
        ],
        "answer": "Because dividing by 4 is the inverse operation of multiplying by 4, which isolates the variable 'y' by itself.",
        "explanation": "The goal of solving an equation is to isolate the variable using the Division Property of Equality to cancel out the coefficient."
    },
    {
        "text": "If a + 5 = 12 and we subtract 5 from the left side, what MUST we do to the right side to keep the equation true?",
        "options": [
            "Add 5 to the right side to balance it out.",
            "Do nothing, because only the left side has the variable.",
            "Subtract 5 from the right side (12 - 5) because whatever operation is done to one side must be done exactly to the other side to maintain equality.",
            "Multiply the right side by 5."
        ],
        "answer": "Subtract 5 from the right side (12 - 5) because whatever operation is done to one side must be done exactly to the other side to maintain equality.",
        "explanation": "The Subtraction Property of Equality dictates that an equation stays balanced only if the exact same value is taken from both sides."
    },
    {
        "text": "What does it mean if x = 7 is the solution to the equation 2x - 4 = 10?",
        "options": [
            "It means the equation is false.",
            "It means if you replace 'x' with 7 in the original equation, the left side will equal the right side 2(7) - 4 = 10.",
            "It means x can be any number up to 7.",
            "It means 10 minus 4 equals 7."
        ],
        "answer": "It means if you replace 'x' with 7 in the original equation, the left side will equal the right side 2(7) - 4 = 10.",
        "explanation": "A solution to an equation is a value that, when substituted for the variable, makes the mathematical statement completely true."
    },
    {
        "text": "Given the equation m/3 = 6, what is the logical next step to solve for m?",
        "options": [
            "Divide by 3 on both sides because there is a fraction.",
            "Subtract 3 from 6.",
            "Multiply both sides by 3 because multiplication cancels out the division (m/3), leaving m = 18.",
            "Add 3 to both sides to make it 9."
        ],
        "answer": "Multiply both sides by 3 because multiplication cancels out the division (m/3), leaving m = 18.",
        "explanation": "Using the Multiplication Property of Equality isolates a variable that is currently being divided."
    },
    {
        "text": "If x + y = 15 and we know that x = 5, how do we find y?",
        "options": [
            "By substituting 5 into x, creating the equation 5 + y = 15, which means y must be 10.",
            "By multiplying 15 and 5.",
            "By assuming y is also 5 because variables are usually equal.",
            "It is impossible to find y with only this information."
        ],
        "answer": "By substituting 5 into x, creating the equation 5 + y = 15, which means y must be 10.",
        "explanation": "Substitution allows us to replace a variable with its known numerical value to solve for the remaining unknown."
    },
	{
        "text": "A delivery service charges ₱100 for pickup plus ₱20 per kilometer traveled. What does the ₱100 represent?",
        "options": [
            "The fixed cost you pay even if no distance is traveled.",
            "The cost per kilometer.",
            "The total cost after 1 kilometer.",
            "The discount for short trips."
        ],
        "answer": "The fixed cost you pay even if no distance is traveled.",
        "explanation": "The ₱100 is the starting fee or base charge. It’s the amount you pay before adding any distance cost. Even if the driver doesn’t travel any kilometers, you still pay ₱100. This is called the fixed cost because it doesn’t change with distance."
    },
    {
        "text": "A printing shop charges ₱50 per page plus a ₱200 setup fee. What does the ₱50 represent?",
        "options": [
            "The cost added for each page printed.",
            "The total cost for all pages.",
            "The setup fee.",
            "The discount for bulk printing."
        ],
        "answer": "The cost added for each page printed.",
        "explanation": "The ₱50 is the rate per page. It means that for every page printed, ₱50 is added to the total cost. The ₱200 setup fee is the fixed cost, while ₱50 is the variable cost that changes depending on how many pages are printed."
    },
    {
        "text": "A line graph shows the total cost of renting a bike at ₱100 per hour. What does the slope of the line in the graph represent?",
        "options": [
            "The cost added for each additional hour of rental.",
            "The total cost before renting.",
            "The number of hours rented.",
            "The total cost after all hours."
        ],
        "answer": "The cost added for each additional hour of rental.",
        "explanation": "The slope shows how much the total cost increases for every extra hour. Since the rate is ₱100 per hour, the slope is 100. This means that for each additional hour, the total cost goes up by ₱100. The slope represents the rate of change between time and cost."
    },
    {
        text: "What is the circumference of a circle with a diameter of 12 cm? (Leave answer in terms of π)",
        options: ["6π cm", "12π cm", "24π cm", "36π cm"],
        answer: "12π cm",
        explanation: "Circumference = π × diameter. So, C = 12π."
    },
    {
        text: "A circular tabletop has a radius of 4 meters. What is its total area?",
        options: ["8π sq. meters", "12π sq. meters", "16π sq. meters", "32π sq. meters"],
        answer: "16π sq. meters",
        explanation: "Area = πr². So, Area = π(4²) = 16π."
    },
    {
        text: "A circular pool with a radius of 5 meters has a 2-meter wide concrete deck built completely around it. What is the area of the concrete deck?",
        options: ["4π sq. meters", "20π sq. meters", "24π sq. meters", "49π sq. meters"],
        answer: "24π sq. meters",
        explanation: "Area of the outer circle (radius 7) is 49π. Area of the pool (radius 5) is 25π. Deck area = 49π - 25π = 24π."
    },
    {
        text: "A cylindrical water tank has a base area of 20π square meters and a height of 5 meters. What is the total volume of the tank?",
        options: ["25π cubic meters", "50π cubic meters", "100π cubic meters", "200π cubic meters"],
        answer: "100π cubic meters",
        explanation: "Volume of a cylinder = base area × height. V = 20π × 5 = 100π."
    },
    {
        text: "A wheel has a circumference of 1.5 meters. If the wheel rolls in a straight line for exactly 10 revolutions, how far did it travel?",
        options: ["1.5 meters", "10 meters", "15 meters", "150 meters"],
        answer: "15 meters",
        explanation: "Distance = Circumference × number of revolutions. Distance = 1.5 × 10 = 15 meters."
    },
    {
        text: "A spinner completes 2.5 full rotations. How many degrees did the spinner rotate in total?",
        options: ["360 degrees", "720 degrees", "900 degrees", "1080 degrees"],
        answer: "900 degrees",
        explanation: "One full rotation is 360 degrees. 2.5 × 360 = 900 degrees."
    },
    {
        text: "A fountain (radius = 2m) has a 1m wide path around it. What is the area of the path?",
        options: ["3π sq. meters", "4π sq. meters", "5π sq. meters", "9π sq. meters"],
        answer: "5π sq. meters",
        explanation: "Outer radius is 3m. Path Area = π(3)² - π(2)² = 9π - 4π = 5π."
    },
    {
        text: "A cylindrical tank has a base area of 15π and height of 4m. If half full, what is the water volume?",
        options: ["15π cubic meters", "30π cubic meters", "60π cubic meters", "120π cubic meters"],
        answer: "30π cubic meters",
        explanation: "Total volume = Base × Height = 15π × 4 = 60π. Half volume = 30π."
