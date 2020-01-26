import tkinter as tk
from tkinter import messagebox
import json
from Naked.toolshed.shell import muterun_js
from sys import stderr
import time
import threading

THREAD_ID = 0

class json_loader:
    def __init__(self):
        with open('path.json', 'r') as data:
            self.doc = json.load(data)

class create_label:
    def __init__(self, WIN, text, color):
        self.label = tk.Label(root, text=text, fg=color)
        self.label['font'] = "Arial 12"
        self.label.pack()

class create_entry:
    def __init__(self, WIN, width, text, side):
        self.entry = tk.Entry(root, width=width, textvariable=text)
        self.entry.pack(side=side)

class create_btn:
    def __init__(self, WIN, text, color, side, callback):
        self.btn = tk.Button(WIN, text=text, fg=color, command=callback)                
        self.btn.pack(side = side)

class create_thread_node(threading.Thread):
    def __init__(self, id, name, path, args):
        threading.Thread.__init__(self)
        self.id = id
        self.name = name
        self.path = path
        self.args = args
    def run(self):
        print ("Starting node script child on Thread " + str(self.id))
        node_child(self.path, self.args)
        print ("Destroying thread with id of " + str(self.id)) 
        messagebox.showinfo("Done!", "Download and conversion of " + self.name + " is complete!")


def getJson():
    j_instance = json_loader()
    return j_instance

def node_child(path, args):
    response = muterun_js('ffmpeg.js', args)
    if response.exitcode == 0:
        print(response.stdout)
    else:
        print(response.stderr)
        if (str(response.stderr) in "NOT_EXISTS_ERR"):
            messagebox.showwarning("Retry!", "Please retry, I had to create the custom folder for you!")
        if (str(response.stderr) in "NO_CODEC_ERR"):
            messagebox.showerror("Fatal!", "Could not find the the codec FFMPEG with the provided path.")

def callback():
    global THREAD_ID
    THREAD_ID += 1
    for k in [e1.entry.get(), e2.entry.get(), e3.entry.get(), e4.entry.get()]:
        if not k:
            return messagebox.showwarning("Hold on","Please fill all the boxes.")    

    try:
        (create_thread_node(THREAD_ID, e4.entry.get(), "ffmpeg.js", '__'.join([e1.entry.get(), e2.entry.get(), e3.entry.get(), e4.entry.get()]))).start()        
    except Exception as e:
        print(e)
        print ("Could not start thread.")
    messagebox.showinfo("Downloading and converting!","Your file is being prepared!")


j = getJson()
t1 = j.doc['pathToCodec']
t2 = j.doc['pathToVideo']
t3 = j.doc['link']

root = tk.Tk()
root.geometry("300x250")
root.resizable(False, False)
root.title("bdv-youtube-mp3")

l1 = create_label(root, "Path to codec:", "green")
e1 = create_entry(root, 20, tk.StringVar(root, value=t1), tk.TOP)

l2 = create_label(root, "Path to .mp3 folder:", "blue")
e2 = create_entry(root, 20, tk.StringVar(root, value=t2), tk.TOP)

l3 = create_label(root, "Youtube link:", "red")
e3 = create_entry(root, 20, tk.StringVar(root, value=t3), tk.TOP)

l4 = create_label(root, "Video a name for tracking purposes:", "black")
e4 = create_entry(root, 30, "",  tk.TOP) 

b = tk.Button(root, text="Download and convert!", fg="black", command=callback)
downloadBtn = create_btn(root, "Download and convert!", "black", tk.BOTTOM, callback)
root.mainloop()
