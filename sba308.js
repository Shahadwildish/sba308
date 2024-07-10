/**
 * Function to get learner data based on course info, assignment group, and submissions.
 * @param {Object} courseInfo - Course information
 * @param {Object} assignmentGroup - Assignment group details
 * @param {Array} learnerSubmissions - Array of learner submissions
 * @returns {Array} - Array of learner performance objects
 */
function getLearnerData(courseInfo, assignmentGroup, learnerSubmissions) {
    try {
        // Validate course_id in assignmentGroup
        if (assignmentGroup.course_id !== courseInfo.id) {
            throw new Error("Assignment Group does not belong to the specified Course");
        }

        // Create a dictionary of assignments
        const assignmentsMap = {};
        assignmentGroup.assignments.forEach(assignment => {
            if (assignment.points_possible <= 0) {
                throw new Error(`Invalid points_possible for assignment ID ${assignment.id}`);
            }
            assignmentsMap[assignment.id] = {
                name: assignment.name,
                due_at: new Date(assignment.due_at),
                points_possible: assignment.points_possible
            };
        });

        // Filter valid submissions and calculate scores
        const learners = {};
        learnerSubmissions.forEach(submission => {
            const assignment = assignmentsMap[submission.assignment_id];
            if (!assignment) {
                throw new Error(`Submission for invalid assignment ID ${submission.assignment_id}`);
            }

            const dueDate = assignment.due_at;
            const submissionDate = new Date(submission.submission.submitted_at);

            // Check if assignment is due
            if (submissionDate <= dueDate) {
                // Calculate the score considering late submissions
                let finalScore = submission.submission.score;
                if (submissionDate > dueDate) {
                    finalScore *= 0.9;  // Deduct 10% for late submissions
                }

                if (!learners[submission.learner_id]) {
                    learners[submission.learner_id] = { id: submission.learner_id, avg: 0, [submission.assignment_id]: 0 };
                }

                learners[submission.learner_id][submission.assignment_id] = finalScore / assignment.points_possible;
                learners[submission.learner_id].avg += finalScore * (assignmentGroup.group_weight / 100);
            } else {
                console.warn(`Submission for assignment ID ${submission.assignment_id} is late or invalid`);
            }
        });

        // Convert learners object to the desired output format
        return Object.values(learners).map(learner => ({
            id: learner.id,
            avg: parseFloat(learner.avg.toFixed(2)),
            ...learner
        }));
    } catch (error) {
        console.error("Error in getLearnerData function:", error.message);
        return [];
    }
}

// Example data
const courseInfo = { id: 1, name: 'JavaScript Basics' };
const assignmentGroup = {
    id: 10,
    name: 'Week 1 Assignments',
    course_id: 1,
    group_weight: 30,
    assignments: [
        { id: 100, name: 'Assignment 1', due_at: '2024-07-05T00:00:00Z', points_possible: 100 },
        { id: 101, name: 'Assignment 2', due_at: '2024-07-10T00:00:00Z', points_possible: 200 }
    ]
};
const learnerSubmissions = [
    { learner_id: 123, assignment_id: 100, submission: { submitted_at: '2024-07-04T00:00:00Z', score: 85 } },
    { learner_id: 123, assignment_id: 101, submission: { submitted_at: '2024-07-11T00:00:00Z', score: 150 } },
    { learner_id: 124, assignment_id: 100, submission: { submitted_at: '2024-07-05T00:00:00Z', score: 90 } },
    { learner_id: 124, assignment_id: 101, submission: { submitted_at: '2024-07-09T00:00:00Z', score: 180 } }
];

// Test cases
console.log(getLearnerData(courseInfo, assignmentGroup, learnerSubmissions));

// Additional Test Cases
const invalidCourseInfo = { id: 2, name: 'JavaScript Advanced' };
console.log(getLearnerData(invalidCourseInfo, assignmentGroup, learnerSubmissions));
// Expected output: Error "Assignment Group does not belong to the specified Course"

const faultyAssignmentGroup = {
    id: 10,
    name: 'Week 1 Assignments',
    course_id: 1,
    group_weight: 30,
    assignments: [
        { id: 100, name: 'Assignment 1', due_at: '2024-07-05T00:00:00Z', points_possible: 0 }
    ]
};
console.log(getLearnerData(courseInfo, faultyAssignmentGroup, learnerSubmissions));
// Expected output: Error "Invalid points_possible for assignment ID 100"

// Edge Case: No Submissions
const emptySubmissions = [];
console.log(getLearnerData(courseInfo, assignmentGroup, emptySubmissions));
// Expected output: [] (Empty array since there are no submissions)

// Edge Case: Late Submissions
const lateSubmissions = [
    { learner_id: 125, assignment_id: 100, submission: { submitted_at: '2024-07-06T00:00:00Z', score: 70 } }
];
console.log(getLearnerData(courseInfo, assignmentGroup, lateSubmissions));
// Expected output: Learner 125's average and assignment score with 10% penalty applied
