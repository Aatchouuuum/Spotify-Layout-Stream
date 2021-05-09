import tkinter as tk #sudo apt-get install python3-tk
from tkinter import messagebox
import os
import time
import subprocess
import signal

class Application(tk.Frame):
    def __init__(self, master=None):
        super().__init__(master)
        self.master = master
        self.pack()
        self.create_widgets()
        #var
        self.initial_PATH = os.getcwd()
        self.spotify_layout = None

    def create_widgets(self):

        #textBox
        self.my_string_var = tk.StringVar()
        self.my_string_var.set("")
        self.my_label = tk.Label(self, textvariable = self.my_string_var)
        self.my_label.pack(side="top")

        #npm install
        self.spotify_layout_button = tk.Button(self)
        self.spotify_layout_button["text"] = "Build the app"
        self.spotify_layout_button["command"] = self.install_npm
        self.spotify_layout_button.pack(side="top")

        #lunch spotify button
        self.spotify_layout_button = tk.Button(self)
        self.spotify_layout_button["text"] = "Lunch Spotify Layout server"
        self.spotify_layout_button["command"] = self.start_spotify_layout
        self.spotify_layout_button.pack(side="top")

        #kill spotify button
        self.spotify_layout_button = tk.Button(self)
        self.spotify_layout_button["text"] = "Kill Spotify Layout server"
        self.spotify_layout_button["command"] = self.stop_spotify_layout
        self.spotify_layout_button.pack(side="top")

        self.quit = tk.Button(self, text="QUIT", fg="red", command=self.quit)
        self.quit.pack(side="bottom")

    def install_npm(self):
        if self.spotify_layout == None:
            #os.chdir("layoutSpotify")
            self.spotify_layout = LunchSubProcess("npm install")
            exit_codes = self.spotify_layout.wait()
            self.spotify_layout = None
            messagebox.showinfo("App build", "Your app should be successfully build")
            self.my_string_var.set("Your app should be successfully build")
            os.chdir(self.initial_PATH)

    def start_spotify_layout(self):
        if self.spotify_layout == None:
            #os.chdir("layoutSpotify")
            self.spotify_layout = LunchSubProcess("node main.js")
            os.chdir(self.initial_PATH)
            self.my_string_var.set("Server is running")

    def stop_spotify_layout(self):
        if self.spotify_layout != None:
            self.spotify_layout.kill()
            self.spotify_layout = None
            self.my_string_var.set("")

    def quit(self):
        if self.spotify_layout != None:
            self.spotify_layout.kill()
            self.spotify_layout = None
        self.master.destroy()

class LunchSubProcess():
    def __init__(self, cmd):
        self.pro = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True, preexec_fn=os.setsid)

    def wait(self):
        return self.pro.wait()

    def kill(self):
        os.killpg(os.getpgid(self.pro.pid), signal.SIGTERM)


if __name__ == "__main__":
    root = tk.Tk()
    root.title("Spotify layout")
    root.geometry("300x150")
    app = Application(master=root)
    app.mainloop()
