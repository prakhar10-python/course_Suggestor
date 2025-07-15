from flask import Flask, request, jsonify, render_template
import json
import os
import openai

app = Flask(__name__)
TASK_FILE = 'tasks.json'

def load_tasks():
    if os.path.exists(TASK_FILE):
        with open(TASK_FILE, 'r') as f:
            return json.load(f)
    return []

def save_task(task):
    tasks = load_tasks()
    tasks.append(task)
    with open(TASK_FILE, 'w') as f:
        json.dump(tasks, f, indent=2)

class UdemyCourseSuggester:
    FALLBACK_COURSES = [
        {
            "task": "Learn Basic Prompting",
            "courses": [
                {
                    "title": "ChatGPT Prompt Engineering for Developers",
                    "description": "Master prompt engineering and get the most out of ChatGPT and other LLMs."
                },
                {
                    "title": "Prompt Engineering for Beginners",
                    "description": "A beginner's guide to writing effective prompts for AI models."
                }
            ]
        }
    ]

    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        openai.api_key = self.api_key

    def get_courses(self, tasks):
        task_descriptions = '\n'.join(f"- {task['description']}" for task in tasks)
        prompt = (
            "You are a helpful assistant of 10+ Years of experience in the field of IT Sector that suggests Udemy courses for tasks."
            "Given the following list of tasks, suggest Udemy or coursera courses that would help the user accomplish these tasks. "
            "For each task, suggest 1-2 relevant Udemy courses (course title and a short description). "
            "Tasks:\n" + task_descriptions +
            "\nReturn the result as a JSON list of objects with 'task', 'courses' (list of {title, description})."
        )
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600,
                temperature=0.4
            )
            content = response.choices[0].message.content
            if not isinstance(content, str):
                return {"fallback": True, "courses": self.FALLBACK_COURSES}
            try:
                return json.loads(content)
            except Exception:
                return {"fallback": True, "courses": self.FALLBACK_COURSES}
        except Exception:
            return {"fallback": True, "courses": self.FALLBACK_COURSES}

@app.route('/add-task', methods=['POST'])
def add_task():
    task = request.get_json()
    if not task or not task.get('description'):
        return jsonify({'error': 'No task description provided'}), 400


    if 'done' not in task:
        task['done'] = False

    save_task(task)
    return jsonify({'message': 'Task saved'}), 200

@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = load_tasks()
    return jsonify({'tasks': tasks})

@app.route('/toggle-task/<int:task_id>', methods=['PATCH'])
def toggle_task(task_id):
    tasks = load_tasks()
    if 0 <= task_id < len(tasks):
        tasks[task_id]['done'] = not tasks[task_id].get('done', False)
        with open(TASK_FILE, 'w') as f:
            json.dump(tasks, f, indent=2)
        return jsonify({'message': 'Task toggled', 'done': tasks[task_id]['done']}), 200
    return jsonify({'error': 'Task not found'}), 404

@app.route('/delete-task/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    tasks = load_tasks()
    if 0 <= task_id < len(tasks):
        tasks.pop(task_id)
        with open(TASK_FILE, 'w') as f:
            json.dump(tasks, f, indent=2)
        return jsonify({'message': 'Task deleted'}), 200
    return jsonify({'error': 'Task not found'}), 404

@app.route('/suggest-courses', methods=['GET'])
def suggest_courses():
    tasks = load_tasks()
    suggester = UdemyCourseSuggester()
    result = suggester.get_courses(tasks)
    return jsonify(result)

@app.route("/")
def home():
    return render_template('index.html') 

if __name__ == '__main__':
    if not os.path.exists(TASK_FILE):
        with open(TASK_FILE, 'w') as f:
            json.dump([], f)
    app.run(debug=True)